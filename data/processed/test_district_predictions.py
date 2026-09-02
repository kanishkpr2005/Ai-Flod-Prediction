import os
import joblib
import pandas as pd


# ============================================================
# SETTINGS
# ============================================================

DATA_FILE = r"data\processed\flood_training_2024.csv"

MODEL_FILE = r"models\flood_random_forest.pkl"

OUTPUT_FILE = r"data\processed\district_predictions_2024.csv"


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("DISTRICT FLOOD PREDICTION TEST")
print("=" * 70)

print("\nLoading dataset...")

df = pd.read_csv(DATA_FILE)

df["date"] = pd.to_datetime(df["date"])

df = df.sort_values(
    ["date", "state", "district"]
).reset_index(drop=True)


# ============================================================
# LOAD MODEL
# ============================================================

print("Loading trained model...")

model = joblib.load(MODEL_FILE)

print("Model loaded successfully.")


# ============================================================
# FEATURES
# ============================================================

FEATURES = [

    "rainfall_total_mm",
    "rainfall_1d",
    "heavy_rain_pixels",
    "extreme_rain_pixels",

    "rainfall_3d",
    "rainfall_7d",
    "rainfall_14d",
    "rainfall_30d",

    "max_rainfall_3d",
    "max_rainfall_7d",
    "max_rainfall_14d",
    "max_rainfall_30d",

    "heavy_rain_3d",
    "heavy_rain_7d",
    "heavy_rain_14d",
    "heavy_rain_30d",

    "extreme_rain_3d",
    "extreme_rain_7d",
    "extreme_rain_14d",
    "extreme_rain_30d",

    "rainfall_previous_day",
    "rainfall_change",
    "rainfall_change_pct",
]


# ============================================================
# PREPARE FEATURES
# ============================================================

X = df[FEATURES].copy()

X = X.replace(
    [float("inf"), float("-inf")],
    pd.NA
)

X = X.fillna(0)


# ============================================================
# PREDICT PROBABILITY
# ============================================================

print("\nGenerating flood probabilities...")

probability = model.predict_proba(X)[:, 1]

df["flood_probability"] = probability


# ============================================================
# RISK LEVEL
# ============================================================

def get_risk_level(probability):

    if probability >= 0.85:
        return "CRITICAL"

    elif probability >= 0.70:
        return "HIGH"

    elif probability >= 0.40:
        return "MEDIUM"

    else:
        return "LOW"


df["risk_level"] = df[
    "flood_probability"
].apply(get_risk_level)


# ============================================================
# SAVE
# ============================================================

os.makedirs(
    os.path.dirname(OUTPUT_FILE),
    exist_ok=True
)

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# LATEST DATE
# ============================================================

latest_date = df["date"].max()

latest = df[
    df["date"] == latest_date
].copy()

latest = latest.sort_values(
    "flood_probability",
    ascending=False
)


# ============================================================
# REPORT
# ============================================================

print("\n" + "=" * 70)
print("PREDICTION SUMMARY")
print("=" * 70)

print(
    "\nLatest date:",
    latest_date.strftime("%Y-%m-%d")
)

print(
    "Districts:",
    len(latest)
)


print("\nRisk distribution:")

print(
    latest["risk_level"].value_counts()
)


# ============================================================
# TOP 20 RISK DISTRICTS
# ============================================================

print("\n" + "=" * 70)
print("TOP 20 HIGHEST-RISK DISTRICTS")
print("=" * 70)

display_columns = [
    "state",
    "district",
    "flood_probability",
    "risk_level",
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_30d"
]

print(
    latest[
        display_columns
    ]
    .head(20)
    .to_string(index=False)
)


# ============================================================
# SAVE LATEST PREDICTIONS
# ============================================================

LATEST_FILE = (
    r"data\processed"
    r"\latest_district_predictions.csv"
)

latest[
    display_columns
].to_csv(
    LATEST_FILE,
    index=False
)


# ============================================================
# COMPLETE
# ============================================================

print("\n" + "=" * 70)
print("PREDICTIONS SAVED")
print("=" * 70)

print(
    "\nComplete dataset:"
)

print(
    os.path.abspath(
        OUTPUT_FILE
    )
)

print(
    "\nLatest district predictions:"
)

print(
    os.path.abspath(
        LATEST_FILE
    )
)

print("\n" + "=" * 70)