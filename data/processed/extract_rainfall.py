import os
import xarray as xr
import pandas as pd


# ============================================================
# SETTINGS
# ============================================================

# Verified IMERG file downloaded from NASA Earthdata
INPUT_FILE = os.path.expanduser(
    "~/Downloads/3B-DAY.MS.MRG.3IMERG.20240101-S000000-E235959.V07B.nc4"
)

# India bounding box
MIN_LON = 69.14
MAX_LON = 100.35
MIN_LAT = 5.03
MAX_LAT = 34.77

# Output CSV
OUTPUT_FILE = os.path.join(
    os.path.dirname(__file__),
    "rainfall_20240101_india.csv"
)


# ============================================================
# CHECK INPUT FILE
# ============================================================

if not os.path.exists(INPUT_FILE):

    print("❌ IMERG file not found:")
    print(INPUT_FILE)
    raise SystemExit(1)


print("==============================================")
print(" IMERG RAINFALL EXTRACTION")
print("==============================================")

print()
print("Input file:")
print(INPUT_FILE)

print()


# ============================================================
# OPEN NETCDF FILE
# ============================================================

print("Opening IMERG dataset...")

ds = xr.open_dataset(
    INPUT_FILE,
    engine="netcdf4"
)

print("✅ Dataset opened successfully.")

print()


# ============================================================
# CHECK COORDINATES
# ============================================================

print("Available coordinates:")
print(list(ds.coords))

print()

print(
    f"Latitude range : {float(ds.lat.min()):.2f} "
    f"to {float(ds.lat.max()):.2f}"
)

print(
    f"Longitude range: {float(ds.lon.min()):.2f} "
    f"to {float(ds.lon.max()):.2f}"
)

print()


# ============================================================
# EXTRACT INDIA REGION
# ============================================================

print("Extracting India bounding box...")

# Check latitude ordering
if float(ds.lat[0]) < float(ds.lat[-1]):

    india = ds.sel(
        lat=slice(MIN_LAT, MAX_LAT),
        lon=slice(MIN_LON, MAX_LON)
    )

else:

    india = ds.sel(
        lat=slice(MAX_LAT, MIN_LAT),
        lon=slice(MIN_LON, MAX_LON)
    )


print("✅ India region extracted.")

print()

print(
    "India region dimensions:"
)

print(india.sizes)

print()


# ============================================================
# EXTRACT PRECIPITATION
# ============================================================

print("Extracting precipitation...")

rainfall = india["precipitation"]


# Remove time dimension if it contains only one value
if "time" in rainfall.dims:

    rainfall = rainfall.isel(time=0)


# Load data into memory
rainfall_values = rainfall.load()


# ============================================================
# CREATE DATAFRAME
# ============================================================

print("Creating rainfall table...")

df = rainfall_values.to_dataframe(
    name="rainfall_mm"
).reset_index()


# ============================================================
# CLEAN DATA
# ============================================================

# Remove missing values
df = df.dropna(
    subset=["rainfall_mm"]
)


# Remove invalid negative rainfall values
df = df[
    df["rainfall_mm"] >= 0
]


# ============================================================
# ADD DATE
# ============================================================

df["date"] = "2024-01-01"

df["date"] = pd.to_datetime(
    df["date"]
)


# ============================================================
# REORDER COLUMNS
# ============================================================

df = df[
    [
        "date",
        "lat",
        "lon",
        "rainfall_mm"
    ]
]


# ============================================================
# SAVE CSV
# ============================================================

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print()
print("==============================================")
print(" EXTRACTION COMPLETE")
print("==============================================")

print()

print(
    f"Rows extracted : {len(df):,}"
)

print(
    f"Minimum rainfall: "
    f"{df['rainfall_mm'].min():.4f} mm"
)

print(
    f"Maximum rainfall: "
    f"{df['rainfall_mm'].max():.4f} mm"
)

print(
    f"Average rainfall: "
    f"{df['rainfall_mm'].mean():.4f} mm"
)

print()

print(
    "CSV saved to:"
)

print(
    OUTPUT_FILE
)

print()

print("Sample data:")
print(
    df.head(10).to_string(index=False)
)

print()

print("==============================================")

ds.close()