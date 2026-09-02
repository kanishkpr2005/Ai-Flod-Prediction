import os
import glob
import numpy as np
import pandas as pd
import xarray as xr
import geopandas as gpd
from shapely.geometry import Point


# ============================================================
# SETTINGS
# ============================================================

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

RAIN_DIR = os.path.join(
    BASE_DIR,
    "data",
    "raw",
    "rainfall"
)

DISTRICT_FILE = os.path.join(
    BASE_DIR,
    "gis",
    "spatial",
    "india_districts.geojson"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "district_rainfall_2024.csv"
)

MIN_LON = 69.14
MAX_LON = 100.35
MIN_LAT = 5.03
MAX_LAT = 34.77


# ============================================================
# LOAD DISTRICTS
# ============================================================

print("Loading district boundaries...")

districts = gpd.read_file(DISTRICT_FILE)

districts = districts[
    districts.geometry.notna()
].copy()

districts = districts.to_crs("EPSG:4326")

print(f"District polygons loaded: {len(districts)}")


# ============================================================
# FIND IMERG FILES
# ============================================================

files = sorted(
    glob.glob(
        os.path.join(
            RAIN_DIR,
            "*.nc4"
        )
    )
)

print(f"IMERG files found: {len(files)}")

if len(files) == 0:
    raise FileNotFoundError(
        "No .nc4 IMERG files found."
    )


# ============================================================
# OUTPUT STORAGE
# ============================================================

all_results = []


# ============================================================
# PROCESS EACH DAY
# ============================================================

for index, file_path in enumerate(files, start=1):

    filename = os.path.basename(file_path)

    print(
        f"\n[{index}/{len(files)}] Processing {filename}"
    )

    # --------------------------------------------------------
    # Extract date from filename
    # --------------------------------------------------------

    date_string = filename.split(".3IMERG.")[1][:8]

    date = pd.to_datetime(
        date_string,
        format="%Y%m%d"
    )

    # --------------------------------------------------------
    # Open NetCDF
    # --------------------------------------------------------

    ds = xr.open_dataset(file_path)

    # --------------------------------------------------------
    # Find precipitation variable
    # --------------------------------------------------------

    if "precipitation" not in ds:
        ds.close()
        raise KeyError(
            f"'precipitation' variable not found in {filename}"
        )

    rainfall = ds["precipitation"]

    # --------------------------------------------------------
    # Remove time dimension if present
    # --------------------------------------------------------

    rainfall = rainfall.squeeze()

    # --------------------------------------------------------
    # Identify latitude / longitude names
    # --------------------------------------------------------

    lat_name = None
    lon_name = None

    for name in rainfall.coords:

        lower = name.lower()

        if lower in ["lat", "latitude"]:
            lat_name = name

        if lower in ["lon", "longitude"]:
            lon_name = name

    if lat_name is None or lon_name is None:

        ds.close()

        raise ValueError(
            f"Latitude/longitude coordinates not found in {filename}"
        )

    # --------------------------------------------------------
    # India bounding box
    # --------------------------------------------------------

    rainfall = rainfall.sel(
        {
            lat_name: slice(
                MIN_LAT,
                MAX_LAT
            ),
            lon_name: slice(
                MIN_LON,
                MAX_LON
            )
        }
    )

    # --------------------------------------------------------
    # Convert to numpy
    # --------------------------------------------------------

    values = rainfall.values

    lats = rainfall[lat_name].values
    lons = rainfall[lon_name].values

    ds.close()

    # --------------------------------------------------------
    # Create grid
    # --------------------------------------------------------

    lon_grid, lat_grid = np.meshgrid(
        lons,
        lats
    )

    values = np.asarray(values)

    # --------------------------------------------------------
    # Flatten
    # --------------------------------------------------------

    flat_values = values.reshape(-1)

    flat_lats = lat_grid.reshape(-1)

    flat_lons = lon_grid.reshape(-1)

    # --------------------------------------------------------
    # Remove invalid rainfall values
    # --------------------------------------------------------

    valid = np.isfinite(flat_values)

    flat_values = flat_values[valid]
    flat_lats = flat_lats[valid]
    flat_lons = flat_lons[valid]

    if len(flat_values) == 0:

        print("No valid rainfall values.")

        continue

    # --------------------------------------------------------
    # Create GeoDataFrame of rainfall pixels
    # --------------------------------------------------------

    points = gpd.GeoDataFrame(
        {
            "rainfall_mm": flat_values
        },
        geometry=gpd.points_from_xy(
            flat_lons,
            flat_lats
        ),
        crs="EPSG:4326"
    )

    # --------------------------------------------------------
    # Spatial join
    # --------------------------------------------------------

    joined = gpd.sjoin(
        points,
        districts[
            [
                "NAME_1",
                "NAME_2",
                "geometry"
            ]
        ],
        how="inner",
        predicate="within"
    )

    if joined.empty:

        print(
            "No rainfall pixels matched districts."
        )

        continue

    # --------------------------------------------------------
    # Clean rainfall
    # --------------------------------------------------------

    joined["rainfall_mm"] = pd.to_numeric(
        joined["rainfall_mm"],
        errors="coerce"
    )

    joined = joined[
        np.isfinite(
            joined["rainfall_mm"]
        )
    ]

    # --------------------------------------------------------
    # District aggregation
    # --------------------------------------------------------

    grouped = (
        joined
        .groupby(
            [
                "NAME_1",
                "NAME_2"
            ],
            dropna=False
        )
        .agg(
            rainfall_mean_mm=(
                "rainfall_mm",
                "mean"
            ),
            rainfall_max_mm=(
                "rainfall_mm",
                "max"
            ),
            rainfall_total_mm=(
                "rainfall_mm",
                "sum"
            ),
            heavy_rain_pixels=(
                "rainfall_mm",
                lambda x: int(
                    (x >= 50).sum()
                )
            ),
            extreme_rain_pixels=(
                "rainfall_mm",
                lambda x: int(
                    (x >= 100).sum()
                )
            )
        )
        .reset_index()
    )

    grouped["date"] = date

    grouped = grouped.rename(
        columns={
            "NAME_1": "state",
            "NAME_2": "district"
        }
    )

    # --------------------------------------------------------
    # Store
    # --------------------------------------------------------

    all_results.append(
        grouped[
            [
                "date",
                "state",
                "district",
                "rainfall_mean_mm",
                "rainfall_max_mm",
                "rainfall_total_mm",
                "heavy_rain_pixels",
                "extreme_rain_pixels"
            ]
        ]
    )

    print(
        f"District records generated: {len(grouped)}"
    )


# ============================================================
# COMBINE ALL DAYS
# ============================================================

print("\nCombining all days...")

if not all_results:

    raise RuntimeError(
        "No district rainfall data was generated."
    )

final_df = pd.concat(
    all_results,
    ignore_index=True
)


# ============================================================
# SORT
# ============================================================

final_df = final_df.sort_values(
    [
        "date",
        "state",
        "district"
    ]
).reset_index(drop=True)


# ============================================================
# SAVE
# ============================================================

final_df.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\n======================================")
print("DISTRICT RAINFALL DATASET CREATED")
print("======================================")

print(
    f"Rows: {len(final_df):,}"
)

print(
    f"Districts: {final_df['district'].nunique():,}"
)

print(
    f"States: {final_df['state'].nunique():,}"
)

print(
    f"Dates: {final_df['date'].nunique():,}"
)

print(
    f"Output: {OUTPUT_FILE}"
)

print("\nSample:")
print(final_df.head(10))