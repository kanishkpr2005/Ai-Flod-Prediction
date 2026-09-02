import os
import glob
import xarray as xr
import pandas as pd
import numpy as np


# ============================================================
# SETTINGS
# ============================================================

INPUT_DIR = "data/raw/rainfall"

OUTPUT_FILE = (
    "data/processed/"
    "rainfall_daily_india_2024.csv"
)

# India approximate bounding box
MIN_LON = 69.14
MAX_LON = 100.35

MIN_LAT = 5.03
MAX_LAT = 34.77


# ============================================================
# FIND FILES
# ============================================================

files = sorted(
    glob.glob(
        os.path.join(
            INPUT_DIR,
            "*.nc4"
        )
    )
)

print()
print("=" * 60)
print(" IMERG 2024 INDIA RAINFALL EXTRACTION")
print("=" * 60)

print()
print("Files found:", len(files))

if len(files) != 366:

    raise RuntimeError(
        f"Expected 366 files, found {len(files)}"
    )


# ============================================================
# PROCESS EACH DAY
# ============================================================

results = []

for index, file in enumerate(files, start=1):

    filename = os.path.basename(file)

    print(
        f"[{index}/366] {filename}"
    )

    try:

        # Open IMERG file
        ds = xr.open_dataset(
            file,
            engine="netcdf4"
        )

        # ----------------------------------------------------
        # Select India
        # ----------------------------------------------------

        india = ds.sel(
            lon=slice(
                MIN_LON,
                MAX_LON
            ),
            lat=slice(
                MIN_LAT,
                MAX_LAT
            )
        )

        # ----------------------------------------------------
        # Rainfall
        # ----------------------------------------------------

        rainfall = (
            india["precipitation"]
            .isel(time=0)
            .values
        )

        rainfall = np.asarray(
            rainfall,
            dtype=np.float32
        )

        # Remove invalid values
        rainfall = rainfall[
            np.isfinite(rainfall)
        ]

        # Remove negative values
        rainfall = rainfall[
            rainfall >= 0
        ]

        if rainfall.size == 0:

            print(
                "  ⚠️ No valid rainfall data"
            )

            ds.close()

            continue

        # ----------------------------------------------------
        # Daily statistics
        # ----------------------------------------------------

        mean_rainfall = float(
            np.mean(rainfall)
        )

        max_rainfall = float(
            np.max(rainfall)
        )

        total_rainfall = float(
            np.sum(rainfall)
        )

        # Heavy rain >= 50 mm/day
        heavy_pixels = int(
            np.sum(
                rainfall >= 50
            )
        )

        # Extreme rain >= 100 mm/day
        extreme_pixels = int(
            np.sum(
                rainfall >= 100
            )
        )

        # ----------------------------------------------------
        # Date
        # ----------------------------------------------------

        date = pd.to_datetime(
            filename.split("IMERG.")[1][:8],
            format="%Y%m%d"
        )

        results.append({

            "date": date,

            "rainfall_mean_mm":
                mean_rainfall,

            "rainfall_max_mm":
                max_rainfall,

            "rainfall_total_mm":
                total_rainfall,

            "heavy_rain_pixels":
                heavy_pixels,

            "extreme_rain_pixels":
                extreme_pixels
        })

        ds.close()

    except Exception as e:

        print(
            f"  ❌ ERROR: {e}"
        )


# ============================================================
# CREATE DATAFRAME
# ============================================================

df = pd.DataFrame(
    results
)

df = df.sort_values(
    "date"
)

# ============================================================
# SAVE
# ============================================================

os.makedirs(
    "data/processed",
    exist_ok=True
)

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print()
print("=" * 60)
print(" EXTRACTION COMPLETE")
print("=" * 60)

print()
print(
    "Days extracted:",
    len(df)
)

print()
print(
    "CSV:",
    os.path.abspath(
        OUTPUT_FILE
    )
)

print()
print(
    "Columns:"
)

for column in df.columns:

    print(
        " -",
        column
    )

print()
print(
    "First 5 rows:"
)

print(
    df.head().to_string(
        index=False
    )
)

print()
print(
    "Last 5 rows:"
)

print(
    df.tail().to_string(
        index=False
    )
)

print()
print("=" * 60)