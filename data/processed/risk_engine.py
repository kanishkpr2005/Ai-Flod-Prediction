import os
import numpy as np
import pandas as pd


# ============================================================
# AUTOMATIC FLOOD RISK + ALERT ENGINE
# ============================================================

INPUT_FILE = r"data\processed\latest_district_predictions.csv"

OUTPUT_FILE = r"data\processed\district_risk_alerts.csv"

ALERTS_FILE = r"data\processed\active_flood_alerts.csv"


# ============================================================
# WEIGHTS
# ============================================================

RAINFALL_WEIGHT = 0.45
WEATHER_WEIGHT = 0.25
SATELLITE_WEIGHT = 0.30


# ============================================================
# THRESHOLDS
# ============================================================

CRITICAL_THRESHOLD = 0.75
HIGH_THRESHOLD = 0.55
MEDIUM_THRESHOLD = 0.35


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 80)
print("AUTOMATIC FLOOD RISK & ALERT ENGINE")
print("=" * 80)

print("\nLoading latest district predictions...")

if not os.path.exists(INPUT_FILE):
    raise FileNotFoundError(
        f"Input file not found:\n{os.path.abspath(INPUT_FILE)}"
    )

df = pd.read_csv(INPUT_FILE)

print(f"Districts loaded: {len(df):,}")


# ============================================================
# REQUIRED COLUMNS
# ============================================================

required = [
    "state",
    "district",
    "flood_probability",
]

missing = [
    col for col in required
    if col not in df.columns
]

if missing:
    raise ValueError(
        "Missing columns: " + ", ".join(missing)
    )


# ============================================================
# UTILITY
# ============================================================

def probability(series):

    values = pd.to_numeric(
        series,
        errors="coerce"
    ).fillna(0.0)

    values = np.where(
        values > 1,
        values / 100.0,
        values
    )

    return pd.Series(
        np.clip(values, 0, 1),
        index=series.index
    )


# ============================================================
# LAYER 1
# RAINFALL ML
# ============================================================

print("\n" + "=" * 80)
print("LAYER 1 - RAINFALL ML")
print("=" * 80)

rainfall_probability = probability(
    df["flood_probability"]
)

df["rainfall_ml_probability"] = (
    rainfall_probability.round(6)
)

print("Rainfall ML layer: ACTIVE")


# ============================================================
# LAYER 2
# LIVE WEATHER
# ============================================================

print("\n" + "=" * 80)
print("LAYER 2 - LIVE WEATHER")
print("=" * 80)

weather_available = False

weather_probability = pd.Series(
    0.0,
    index=df.index
)


# Future weather file
WEATHER_FILE = (
    r"data\processed\latest_district_weather.csv"
)


if os.path.exists(WEATHER_FILE):

    weather_df = pd.read_csv(
        WEATHER_FILE
    )

    if (
        "state" in weather_df.columns
        and
        "district" in weather_df.columns
    ):

        weather_df = weather_df.drop_duplicates(
            subset=["state", "district"]
        )

        df = df.merge(
            weather_df,
            on=["state", "district"],
            how="left",
            suffixes=("", "_weather")
        )

        probability_columns = [
            "weather_probability",
            "flood_probability_weather",
            "weather_risk_probability",
            "forecast_flood_probability",
        ]

        found = None

        for col in probability_columns:

            if col in df.columns:
                found = col
                break

        if found:

            weather_probability = probability(
                df[found]
            )

            weather_available = True

            print(
                f"Weather probability: {found}"
            )


else:

    print(
        "Weather dataset not available."
    )

    print(
        "Weather layer: WAITING"
    )


df["weather_probability"] = (
    weather_probability.round(6)
)


# ============================================================
# LAYER 3
# SENTINEL-1 SAR
# ============================================================

print("\n" + "=" * 80)
print("LAYER 3 - SENTINEL-1 SAR")
print("=" * 80)

satellite_available = False

satellite_probability = pd.Series(
    0.0,
    index=df.index
)


SATELLITE_FILE = (
    r"data\processed\latest_satellite_flood_features.csv"
)


if os.path.exists(SATELLITE_FILE):

    satellite_df = pd.read_csv(
        SATELLITE_FILE
    )

    if (
        "state" in satellite_df.columns
        and
        "district" in satellite_df.columns
    ):

        satellite_df = satellite_df.drop_duplicates(
            subset=["state", "district"]
        )

        df = df.merge(
            satellite_df,
            on=["state", "district"],
            how="left",
            suffixes=("", "_satellite")
        )

        probability_columns = [
            "satellite_flood_probability",
            "sar_flood_probability",
            "satellite_probability",
            "sar_probability",
        ]

        found = None

        for col in probability_columns:

            if col in df.columns:
                found = col
                break

        if found:

            satellite_probability = probability(
                df[found]
            )

            satellite_available = True

            print(
                f"Satellite probability: {found}"
            )


else:

    print(
        "Sentinel-1 feature dataset not available yet."
    )

    print(
        "Satellite layer: WAITING"
    )


df["satellite_probability"] = (
    satellite_probability.round(6)
)


# ============================================================
# DYNAMIC WEIGHTS
# ============================================================

print("\n" + "=" * 80)
print("ACTIVE PREDICTION LAYERS")
print("=" * 80)


available = {
    "rainfall": RAINFALL_WEIGHT
}


if weather_available:
    available["weather"] = WEATHER_WEIGHT


if satellite_available:
    available["satellite"] = SATELLITE_WEIGHT


total_weight = sum(
    available.values()
)


weights = {
    key: value / total_weight
    for key, value in available.items()
}


for layer, weight in weights.items():

    print(
        f"{layer:12s}: {weight * 100:.1f}%"
    )


# ============================================================
# FINAL FUSION
# ============================================================

print("\n" + "=" * 80)
print("CALCULATING FINAL FLOOD PROBABILITY")
print("=" * 80)


final_probability = (
    rainfall_probability
    * weights["rainfall"]
)


if weather_available:

    final_probability += (
        weather_probability
        * weights["weather"]
    )


if satellite_available:

    final_probability += (
        satellite_probability
        * weights["satellite"]
    )


final_probability = np.clip(
    final_probability,
    0,
    1
)


df["final_flood_probability"] = (
    pd.Series(
        final_probability,
        index=df.index
    ).round(6)
)


# ============================================================
# RISK LEVEL
# ============================================================

def risk_level(value):

    if value >= CRITICAL_THRESHOLD:
        return "CRITICAL"

    if value >= HIGH_THRESHOLD:
        return "HIGH"

    if value >= MEDIUM_THRESHOLD:
        return "MEDIUM"

    return "LOW"


df["risk_level"] = (
    df["final_flood_probability"]
    .apply(risk_level)
)


# ============================================================
# ALERT
# ============================================================

df["alert"] = (
    df["risk_level"]
    .isin(["HIGH", "CRITICAL"])
)


# ============================================================
# PRIORITY
# ============================================================

priority = {
    "CRITICAL": 1,
    "HIGH": 2,
    "MEDIUM": 3,
    "LOW": 4,
}

df["alert_priority"] = (
    df["risk_level"]
    .map(priority)
)


# ============================================================
# CONFIDENCE
# ============================================================

def confidence(row):

    values = [
        row["rainfall_ml_probability"]
    ]

    if weather_available:
        values.append(
            row["weather_probability"]
        )

    if satellite_available:
        values.append(
            row["satellite_probability"]
        )

    if len(values) == 1:
        return "MEDIUM"

    spread = (
        max(values) -
        min(values)
    )

    if spread <= 0.15:
        return "HIGH"

    if spread <= 0.30:
        return "MEDIUM"

    return "LOW"


df["prediction_confidence"] = (
    df.apply(
        confidence,
        axis=1
    )
)


# ============================================================
# EVIDENCE
# ============================================================

def evidence(row):

    result = []

    rainfall = (
        row["rainfall_ml_probability"]
        * 100
    )

    if rainfall >= 70:

        result.append(
            f"strong rainfall ML signal ({rainfall:.1f}%)"
        )

    elif rainfall >= 40:

        result.append(
            f"moderate rainfall ML signal ({rainfall:.1f}%)"
        )


    if weather_available:

        weather = (
            row["weather_probability"]
            * 100
        )

        if weather >= 70:

            result.append(
                f"strong weather signal ({weather:.1f}%)"
            )

        elif weather >= 40:

            result.append(
                f"moderate weather signal ({weather:.1f}%)"
            )


    if satellite_available:

        satellite = (
            row["satellite_probability"]
            * 100
        )

        if satellite >= 70:

            result.append(
                f"strong SAR signal ({satellite:.1f}%)"
            )

        elif satellite >= 40:

            result.append(
                f"moderate SAR signal ({satellite:.1f}%)"
            )


    if not result:

        return "limited flood evidence"

    return ", ".join(result)


df["risk_evidence"] = (
    df.apply(
        evidence,
        axis=1
    )
)


# ============================================================
# ALERT MESSAGE
# ============================================================

def alert_message(row):

    district = row["district"]

    state = row["state"]

    probability_value = (
        row["final_flood_probability"]
        * 100
    )

    level = row["risk_level"]

    confidence_value = (
        row["prediction_confidence"]
    )

    evidence_value = (
        row["risk_evidence"]
    )


    if level == "CRITICAL":

        return (
            f"CRITICAL flood risk detected in "
            f"{district}, {state}. "
            f"Probability: {probability_value:.1f}%. "
            f"Confidence: {confidence_value}. "
            f"Evidence: {evidence_value}."
        )


    if level == "HIGH":

        return (
            f"HIGH flood risk detected in "
            f"{district}, {state}. "
            f"Probability: {probability_value:.1f}%. "
            f"Confidence: {confidence_value}. "
            f"Evidence: {evidence_value}."
        )


    if level == "MEDIUM":

        return (
            f"Moderate flood risk detected in "
            f"{district}, {state}. "
            f"Probability: {probability_value:.1f}%."
        )


    return (
        f"Low flood risk in "
        f"{district}, {state}. "
        f"Probability: {probability_value:.1f}%."
    )


df["alert_message"] = (
    df.apply(
        alert_message,
        axis=1
    )
)


# ============================================================
# SAVE COMPLETE DATASET
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
# SAVE ACTIVE ALERTS
# ============================================================

alerts = (
    df[
        df["alert"] == True
    ]
    .sort_values(
        [
            "alert_priority",
            "final_flood_probability"
        ],
        ascending=[
            True,
            False
        ]
    )
)


alerts.to_csv(
    ALERTS_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 80)
print("FINAL FLOOD RISK SUMMARY")
print("=" * 80)

print(
    f"\nTotal districts: {len(df):,}"
)

print("\nRisk distribution:")

print(
    df["risk_level"]
    .value_counts()
)


print(
    "\nAutomatic alerts:",
    int(df["alert"].sum())
)


print("\nActive layers:")

for layer, weight in weights.items():

    print(
        f"  {layer}: {weight * 100:.1f}%"
    )


# ============================================================
# TOP ALERTS
# ============================================================

print("\n" + "=" * 80)
print("TOP AUTOMATIC FLOOD ALERTS")
print("=" * 80)


columns = [
    "state",
    "district",
    "rainfall_ml_probability",
    "weather_probability",
    "satellite_probability",
    "final_flood_probability",
    "risk_level",
    "prediction_confidence",
]


print(
    alerts[columns]
    .head(20)
    .to_string(index=False)
)


# ============================================================
# COMPLETE
# ============================================================

print("\n" + "=" * 80)
print("RISK ENGINE COMPLETE")
print("=" * 80)

print(
    "\nRisk dataset:"
)

print(
    os.path.abspath(OUTPUT_FILE)
)

print(
    "\nActive alerts:"
)

print(
    os.path.abspath(ALERTS_FILE)
)

print("\n" + "=" * 80)