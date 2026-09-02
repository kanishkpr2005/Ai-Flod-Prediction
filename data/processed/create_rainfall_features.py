import pandas as pd
import os

INPUT_FILE = r"data\processed\district_rainfall_2024.csv"
OUTPUT_FILE = r"data\processed\rainfall_features_2024.csv"

print("=" * 70)
print("CREATING DISTRICT-WISE RAINFALL ML FEATURES")
print("=" * 70)

# ---------------------------------------------------------
# 1. LOAD DATA
# ---------------------------------------------------------

print("\nLoading district rainfall data...")

df = pd.read_csv(INPUT_FILE)

df["date"] = pd.to_datetime(df["date"], errors="coerce")

# Numeric conversion
numeric_columns = [
    "rainfall_mean_mm",
    "rainfall_max_mm",
    "rainfall_total_mm",
    "heavy_rain_pixels",
    "extreme_rain_pixels",
]

for col in numeric_columns:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

# Remove invalid dates
df = df.dropna(subset=["date"])

print(f"Input rows: {len(df):,}")
print(f"Districts: {df['district'].nunique()}")
print(f"States: {df['state'].nunique()}")
print(f"Dates: {df['date'].nunique()}")

# ---------------------------------------------------------
# 2. IMPORTANT:
# USE DISTRICT MEAN RAINFALL AS DAILY RAINFALL
# ---------------------------------------------------------

if "rainfall_mean_mm" not in df.columns:
    raise ValueError(
        "rainfall_mean_mm column is missing from district_rainfall_2024.csv"
    )

# The district mean is the physically meaningful
# district-average daily rainfall.
df["daily_rainfall_mm"] = (
    df["rainfall_mean_mm"]
    .clip(lower=0)
)

# ---------------------------------------------------------
# 3. SORT
# ---------------------------------------------------------

df = df.sort_values(
    ["state", "district", "date"]
).reset_index(drop=True)

group = df.groupby(
    ["state", "district"],
    group_keys=False
)

# ---------------------------------------------------------
# 4. DAILY / ROLLING RAINFALL
# ---------------------------------------------------------

print("\nCreating rainfall windows...")

# 1-day
df["rainfall_1d"] = df["daily_rainfall_mm"]

# 3-day
df["rainfall_3d"] = group["daily_rainfall_mm"].transform(
    lambda x: x.rolling(3, min_periods=1).sum()
)

# 7-day
df["rainfall_7d"] = group["daily_rainfall_mm"].transform(
    lambda x: x.rolling(7, min_periods=1).sum()
)

# 14-day
df["rainfall_14d"] = group["daily_rainfall_mm"].transform(
    lambda x: x.rolling(14, min_periods=1).sum()
)

# 30-day
df["rainfall_30d"] = group["daily_rainfall_mm"].transform(
    lambda x: x.rolling(30, min_periods=1).sum()
)

# ---------------------------------------------------------
# 5. MAXIMUM DAILY RAINFALL IN WINDOWS
# ---------------------------------------------------------

df["max_rainfall_3d"] = group["daily_rainfall_mm"].transform(
    lambda x: x.rolling(3, min_periods=1).max()
)

df["max_rainfall_7d"] = group["daily_rainfall_mm"].transform(
    lambda x: x.rolling(7, min_periods=1).max()
)

df["max_rainfall_14d"] = group["daily_rainfall_mm"].transform(
    lambda x: x.rolling(14, min_periods=1).max()
)

df["max_rainfall_30d"] = group["daily_rainfall_mm"].transform(
    lambda x: x.rolling(30, min_periods=1).max()
)

# ---------------------------------------------------------
# 6. HEAVY RAINFALL ACTIVITY
# ---------------------------------------------------------

df["heavy_rain_3d"] = group["heavy_rain_pixels"].transform(
    lambda x: x.rolling(3, min_periods=1).sum()
)

df["heavy_rain_7d"] = group["heavy_rain_pixels"].transform(
    lambda x: x.rolling(7, min_periods=1).sum()
)

df["heavy_rain_14d"] = group["heavy_rain_pixels"].transform(
    lambda x: x.rolling(14, min_periods=1).sum()
)

df["heavy_rain_30d"] = group["heavy_rain_pixels"].transform(
    lambda x: x.rolling(30, min_periods=1).sum()
)

# ---------------------------------------------------------
# 7. EXTREME RAINFALL ACTIVITY
# ---------------------------------------------------------

df["extreme_rain_3d"] = group["extreme_rain_pixels"].transform(
    lambda x: x.rolling(3, min_periods=1).sum()
)

df["extreme_rain_7d"] = group["extreme_rain_pixels"].transform(
    lambda x: x.rolling(7, min_periods=1).sum()
)

df["extreme_rain_14d"] = group["extreme_rain_pixels"].transform(
    lambda x: x.rolling(14, min_periods=1).sum()
)

df["extreme_rain_30d"] = group["extreme_rain_pixels"].transform(
    lambda x: x.rolling(30, min_periods=1).sum()
)

# ---------------------------------------------------------
# 8. RAINFALL TREND
# ---------------------------------------------------------

df["rainfall_previous_day"] = group["daily_rainfall_mm"].shift(1)

df["rainfall_change"] = (
    df["daily_rainfall_mm"]
    - df["rainfall_previous_day"]
)

previous = df["rainfall_previous_day"].replace(0, pd.NA)

df["rainfall_change_pct"] = (
    df["rainfall_change"] / previous
) * 100

df["rainfall_change_pct"] = (
    df["rainfall_change_pct"]
    .replace([float("inf"), float("-inf")], pd.NA)
    .fillna(0)
)

# ---------------------------------------------------------
# 9. FINAL COLUMNS
# ---------------------------------------------------------

columns = [
    "date",
    "state",
    "district",

    # Original source information
    "rainfall_mean_mm",
    "rainfall_max_mm",
    "rainfall_total_mm",

    "heavy_rain_pixels",
    "extreme_rain_pixels",

    # ML rainfall features
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_14d",
    "rainfall_30d",

    # Maximum rainfall
    "max_rainfall_3d",
    "max_rainfall_7d",
    "max_rainfall_14d",
    "max_rainfall_30d",

    # Heavy rainfall activity
    "heavy_rain_3d",
    "heavy_rain_7d",
    "heavy_rain_14d",
    "heavy_rain_30d",

    # Extreme rainfall activity
    "extreme_rain_3d",
    "extreme_rain_7d",
    "extreme_rain_14d",
    "extreme_rain_30d",

    # Trend
    "rainfall_previous_day",
    "rainfall_change",
    "rainfall_change_pct",
]

# Only keep columns that exist
columns = [c for c in columns if c in df.columns]

df = df[columns]

# ---------------------------------------------------------
# 10. ROUND RAINFALL VALUES
# ---------------------------------------------------------

rainfall_columns = [
    "rainfall_mean_mm",
    "rainfall_max_mm",
    "rainfall_total_mm",
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_14d",
    "rainfall_30d",
    "max_rainfall_3d",
    "max_rainfall_7d",
    "max_rainfall_14d",
    "max_rainfall_30d",
    "rainfall_previous_day",
    "rainfall_change",
    "rainfall_change_pct",
]

for col in rainfall_columns:
    if col in df.columns:
        df[col] = pd.to_numeric(
            df[col],
            errors="coerce"
        ).fillna(0).round(4)

# ---------------------------------------------------------
# 11. SAVE
# ---------------------------------------------------------

os.makedirs(
    os.path.dirname(OUTPUT_FILE),
    exist_ok=True
)

df.to_csv(
    OUTPUT_FILE,
    index=False
)

# ---------------------------------------------------------
# 12. VALIDATION
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("DISTRICT RAINFALL FEATURES CREATED")
print("=" * 70)

print(f"Rows: {len(df):,}")
print(f"Columns: {len(df.columns)}")
print(f"Districts: {df['district'].nunique()}")
print(f"States: {df['state'].nunique()}")
print(f"Dates: {df['date'].nunique()}")

print("\nRainfall statistics:")
print(
    df[
        [
            "rainfall_1d",
            "rainfall_3d",
            "rainfall_7d",
            "rainfall_14d",
            "rainfall_30d",
        ]
    ].describe().round(2)
)

print("\nSample:")
print(
    df[
        [
            "date",
            "state",
            "district",
            "rainfall_1d",
            "rainfall_3d",
            "rainfall_7d",
            "rainfall_30d",
        ]
    ].head(10).to_string(index=False)
)

print("\nOutput:")
print(os.path.abspath(OUTPUT_FILE))

print("=" * 70)
print("DONE")
print("=" * 70)