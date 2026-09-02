import os
import sys
import time
import pandas as pd

# Allow importing backend modules
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from backend.weather_service import get_weather_and_risk


# ============================================================
# SETTINGS
# ============================================================

DISTRICT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "district_locations.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "live_weather_predictions.csv"
)

REQUEST_DELAY = 0.15


# ============================================================
# LOAD DISTRICTS
# ============================================================

print("=" * 70)
print("LIVE WEATHER DISTRICT UPDATE")
print("=" * 70)

df = pd.read_csv(DISTRICT_FILE)

required = [
    "state",
    "district",
    "latitude",
    "longitude"
]

missing = [
    col for col in required
    if col not in df.columns
]

if missing:
    raise ValueError(
        f"Missing columns: {missing}"
    )

print(f"\nDistricts loaded: {len(df)}")


# ============================================================
# WEATHER COLLECTION
# ============================================================

results = []

total = len(df)

for index, row in df.iterrows():

    state = row["state"]
    district = row["district"]

    latitude = float(row["latitude"])
    longitude = float(row["longitude"])

    print(
        f"[{index + 1}/{total}] "
        f"{district}, {state}"
    )

    try:

        result = get_weather_and_risk(
            latitude,
            longitude
        )

        weather = result["weather"]
        forecast = result["forecast"]
        risk = result["risk"]

        results.append({

            "state": state,

            "district": district,

            "latitude": latitude,

            "longitude": longitude,

            # Current weather
            "temperature": weather["temperature"],

            "humidity": weather["humidity"],

            "current_precipitation_mm":
                weather["precipitation"],

            "weather_code":
                weather["weather_code"],

            # Forecast
            "forecast_rainfall_mm":
                forecast["total_rainfall_mm"],

            "maximum_hourly_rainfall_mm":
                forecast[
                    "maximum_hourly_rainfall_mm"
                ],

            "maximum_rain_probability":
                forecast[
                    "maximum_rain_probability"
                ],

            # Risk
            "weather_risk_score":
                risk["risk_score"],

            "weather_risk_level":
                risk["risk_level"],

            "weather_recommendation":
                risk["recommendation"],

            "weather_factors":
                " | ".join(
                    risk["factors"]
                )
        })

    except Exception as error:

        print(
            f"  ERROR: {error}"
        )

        results.append({

            "state": state,

            "district": district,

            "latitude": latitude,

            "longitude": longitude,

            "temperature": 0.0,

            "humidity": 0.0,

            "current_precipitation_mm": 0.0,

            "weather_code": 0,

            "forecast_rainfall_mm": 0.0,

            "maximum_hourly_rainfall_mm": 0.0,

            "maximum_rain_probability": 0.0,

            "weather_risk_score": 0.0,

            "weather_risk_level": "UNKNOWN",

            "weather_recommendation":
                "Weather data unavailable.",

            "weather_factors":
                "Weather API unavailable"
        })

    time.sleep(REQUEST_DELAY)


# ============================================================
# SAVE
# ============================================================

weather_df = pd.DataFrame(results)

os.makedirs(
    os.path.dirname(OUTPUT_FILE),
    exist_ok=True
)

weather_df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("LIVE WEATHER UPDATE COMPLETE")
print("=" * 70)

print(
    f"\nTotal districts: "
    f"{len(weather_df)}"
)

print(
    "\nWeather risk distribution:"
)

print(
    weather_df[
        "weather_risk_level"
    ].value_counts()
)

print(
    "\nOutput:"
)

print(
    os.path.abspath(
        OUTPUT_FILE
    )
)

print("\n" + "=" * 70)