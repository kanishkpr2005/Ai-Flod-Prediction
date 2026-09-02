# backend/weather_monitor.py

import os
import time
from datetime import datetime

import pandas as pd

from automatic_alert import create_automatic_alert


# ============================================================
# CONFIGURATION
# ============================================================

MONITOR_INTERVAL_SECONDS = 30 * 60

PROJECT_ROOT = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        ".."
    )
)

# Preferred district prediction files
PREDICTION_FILES = [
    os.path.join(
        PROJECT_ROOT,
        "data",
        "processed",
        "latest_district_predictions.csv"
    ),
    os.path.join(
        PROJECT_ROOT,
        "data",
        "processed",
        "district_risk_alerts.csv"
    ),
]


# ============================================================
# LOCATION COLUMN DETECTION
# ============================================================

DISTRICT_COLUMNS = [
    "district",
    "District",
    "DISTRICT",
    "district_name",
    "District_Name",
]

STATE_COLUMNS = [
    "state",
    "State",
    "STATE",
    "state_name",
    "State_Name",
]

LATITUDE_COLUMNS = [
    "latitude",
    "Latitude",
    "LATITUDE",
    "lat",
    "Lat",
]

LONGITUDE_COLUMNS = [
    "longitude",
    "Longitude",
    "LONGITUDE",
    "lon",
    "Lon",
    "lng",
    "Lng",
]


# ============================================================
# FIND COLUMN
# ============================================================

def find_column(df, candidates):

    for column in candidates:

        if column in df.columns:
            return column

    return None


# ============================================================
# FIND LOCATION DATASET
# ============================================================

def find_location_file():

    for file_path in PREDICTION_FILES:

        if os.path.exists(file_path):

            return file_path

    raise FileNotFoundError(
        "\nNo district prediction/location dataset found.\n"
        "Expected one of:\n"
        + "\n".join(PREDICTION_FILES)
    )


# ============================================================
# LOAD ALL INDIAN DISTRICT LOCATIONS
# ============================================================

def load_monitored_locations():

    file_path = find_location_file()

    print(
        f"\nLoading district locations from:\n"
        f"{file_path}"
    )

    df = pd.read_csv(file_path)

    print(
        f"Dataset rows: {len(df):,}"
    )

    # --------------------------------------------------------
    # Detect columns
    # --------------------------------------------------------

    district_column = find_column(
        df,
        DISTRICT_COLUMNS
    )

    state_column = find_column(
        df,
        STATE_COLUMNS
    )

    latitude_column = find_column(
        df,
        LATITUDE_COLUMNS
    )

    longitude_column = find_column(
        df,
        LONGITUDE_COLUMNS
    )

    if district_column is None:

        raise ValueError(
            "District column not found.\n"
            f"Available columns: {list(df.columns)}"
        )

    if state_column is None:

        raise ValueError(
            "State column not found.\n"
            f"Available columns: {list(df.columns)}"
        )

    if latitude_column is None:

        raise ValueError(
            "Latitude column not found.\n"
            f"Available columns: {list(df.columns)}"
        )

    if longitude_column is None:

        raise ValueError(
            "Longitude column not found.\n"
            f"Available columns: {list(df.columns)}"
        )

    print("\nDetected location columns:")

    print(
        f"District  : {district_column}"
    )

    print(
        f"State     : {state_column}"
    )

    print(
        f"Latitude  : {latitude_column}"
    )

    print(
        f"Longitude : {longitude_column}"
    )

    # --------------------------------------------------------
    # Keep only required columns
    # --------------------------------------------------------

    locations = df[
        [
            district_column,
            state_column,
            latitude_column,
            longitude_column,
        ]
    ].copy()

    locations.columns = [
        "district",
        "state",
        "latitude",
        "longitude",
    ]

    # --------------------------------------------------------
    # Clean text
    # --------------------------------------------------------

    locations["district"] = (
        locations["district"]
        .astype(str)
        .str.strip()
    )

    locations["state"] = (
        locations["state"]
        .astype(str)
        .str.strip()
    )

    # --------------------------------------------------------
    # Convert coordinates
    # --------------------------------------------------------

    locations["latitude"] = pd.to_numeric(
        locations["latitude"],
        errors="coerce"
    )

    locations["longitude"] = pd.to_numeric(
        locations["longitude"],
        errors="coerce"
    )

    # --------------------------------------------------------
    # Remove invalid coordinates
    # --------------------------------------------------------

    locations = locations.dropna(
        subset=[
            "latitude",
            "longitude"
        ]
    )

    # --------------------------------------------------------
    # India coordinate validation
    #
    # Broad bounding box:
    # latitude  : 5 - 38
    # longitude : 67 - 100
    # --------------------------------------------------------

    locations = locations[
        (locations["latitude"] >= 5)
        & (locations["latitude"] <= 38)
        & (locations["longitude"] >= 67)
        & (locations["longitude"] <= 100)
    ]

    # --------------------------------------------------------
    # Remove invalid names
    # --------------------------------------------------------

    locations = locations[
        (locations["district"] != "")
        & (locations["district"].str.lower() != "nan")
        & (locations["state"] != "")
        & (locations["state"].str.lower() != "nan")
    ]

    # --------------------------------------------------------
    # Remove duplicate district/state coordinates
    # --------------------------------------------------------

    locations = locations.drop_duplicates(
        subset=[
            "state",
            "district",
        ]
    )

    locations = locations.reset_index(
        drop=True
    )

    # --------------------------------------------------------
    # Convert to dictionaries
    # --------------------------------------------------------

    monitored_locations = []

    for _, row in locations.iterrows():

        monitored_locations.append(
            {
                "name": (
                    f"{row['district']}, "
                    f"{row['state']}"
                ),

                "district": row["district"],

                "state": row["state"],

                "latitude": float(
                    row["latitude"]
                ),

                "longitude": float(
                    row["longitude"]
                ),
            }
        )

    print(
        f"\nValid district locations loaded: "
        f"{len(monitored_locations)}"
    )

    return monitored_locations


# ============================================================
# LOAD LOCATIONS ON STARTUP
# ============================================================

MONITORED_LOCATIONS = load_monitored_locations()


# ============================================================
# MONITOR ONE DISTRICT
# ============================================================

def monitor_location(location):

    name = location["name"]

    district = location["district"]

    state = location["state"]

    latitude = location["latitude"]

    longitude = location["longitude"]

    print("\n----------------------------------------")

    print(
        f"Checking: {name}"
    )

    print(
        f"Coordinates: "
        f"{latitude}, {longitude}"
    )

    print(
        f"Time: "
        f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )

    print("----------------------------------------")

    try:

        result = create_automatic_alert(
            latitude=latitude,
            longitude=longitude,
            location_name=name,
        )

        # ----------------------------------------------------
        # Risk
        # ----------------------------------------------------

        risk = result.get(
            "risk",
            {}
        )

        risk_score = risk.get(
            "risk_score",
            0
        )

        risk_level = risk.get(
            "risk_level",
            "LOW"
        )

        print(
            f"Risk Score: "
            f"{risk_score}/100"
        )

        print(
            f"Risk Level: "
            f"{risk_level}"
        )

        # ----------------------------------------------------
        # Forecast
        # ----------------------------------------------------

        forecast = result.get(
            "forecast",
            {}
        )

        forecast_rainfall = forecast.get(
            "total_rainfall_mm",
            0
        )

        maximum_hourly_rainfall = forecast.get(
            "maximum_hourly_rainfall_mm",
            0
        )

        maximum_rain_probability = forecast.get(
            "maximum_rain_probability",
            0
        )

        print(
            f"Next 6h Rainfall: "
            f"{forecast_rainfall} mm"
        )

        print(
            f"Max Hourly Rainfall: "
            f"{maximum_hourly_rainfall} mm"
        )

        print(
            f"Max Rain Probability: "
            f"{maximum_rain_probability}%"
        )

        # ----------------------------------------------------
        # Alert created
        # ----------------------------------------------------

        if result.get("alert_created"):

            print(
                "\n!!! AUTOMATIC ALERT CREATED !!!"
            )

            alert = result.get(
                "alert",
                {}
            )

            print(
                f"Alert ID: "
                f"{alert.get('id')}"
            )

            print(
                f"Severity: "
                f"{alert.get('severity')}"
            )

            print(
                f"Status: "
                f"{alert.get('status')}"
            )

        # ----------------------------------------------------
        # Alert updated
        # ----------------------------------------------------

        elif result.get("alert_updated"):

            print(
                "\n!!! ACTIVE ALERT UPDATED !!!"
            )

            alert = result.get(
                "alert",
                {}
            )

            print(
                f"Alert ID: "
                f"{alert.get('id')}"
            )

            print(
                f"Severity: "
                f"{alert.get('severity')}"
            )

        # ----------------------------------------------------
        # Alert resolved
        # ----------------------------------------------------

        elif result.get("alert_resolved"):

            print(
                "\n!!! ALERT AUTOMATICALLY RESOLVED !!!"
            )

            print(
                f"Location: {name}"
            )

            print(
                f"Current Risk: {risk_level}"
            )

            print(
                f"Resolved Alerts: "
                f"{result.get('resolved_count', 0)}"
            )

        # ----------------------------------------------------
        # Nothing changed
        # ----------------------------------------------------

        else:

            print(
                "No automatic alert change."
            )

    except Exception as error:

        print(
            f"\nMonitoring error for {name}:"
        )

        print(error)


# ============================================================
# RUN ONE COMPLETE INDIA MONITORING CYCLE
# ============================================================

def run_monitoring_cycle():

    print("\n")

    print(
        "=" * 80
    )

    print(
        "        INDIA-WIDE AI FLOOD MONITOR"
    )

    print(
        "=" * 80
    )

    print(
        f"Monitoring districts: "
        f"{len(MONITORED_LOCATIONS)}"
    )

    print(
        f"Monitoring interval: "
        f"{MONITOR_INTERVAL_SECONDS // 60} minutes"
    )

    print(
        "=" * 80
    )

    total = len(
        MONITORED_LOCATIONS
    )

    successful = 0

    failed = 0

    # --------------------------------------------------------
    # Every district
    # --------------------------------------------------------

    for index, location in enumerate(
        MONITORED_LOCATIONS,
        start=1
    ):

        print(
            f"\n[{index}/{total}]"
        )

        try:

            monitor_location(
                location
            )

            successful += 1

        except Exception:

            failed += 1

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    print("\n")

    print(
        "=" * 80
    )

    print(
        "MONITORING CYCLE COMPLETED"
    )

    print(
        "=" * 80
    )

    print(
        f"Total districts : {total}"
    )

    print(
        f"Successful      : {successful}"
    )

    print(
        f"Failed          : {failed}"
    )

    print(
        "=" * 80
    )


# ============================================================
# CONTINUOUS MONITORING
# ============================================================

def start_monitoring():

    print("\n")

    print(
        "=" * 80
    )

    print(
        "      INDIA-WIDE BACKGROUND MONITOR STARTED"
    )

    print(
        "=" * 80
    )

    print(
        f"Districts monitored: "
        f"{len(MONITORED_LOCATIONS)}"
    )

    print(
        f"Interval: "
        f"{MONITOR_INTERVAL_SECONDS // 60} minutes"
    )

    print(
        "Press CTRL+C to stop."
    )

    print(
        "=" * 80
    )

    try:

        while True:

            run_monitoring_cycle()

            print(
                f"\nNext automatic weather check "
                f"in {MONITOR_INTERVAL_SECONDS} seconds..."
            )

            time.sleep(
                MONITOR_INTERVAL_SECONDS
            )

    except KeyboardInterrupt:

        print(
            "\n\nBackground monitoring stopped."
        )


# ============================================================
# START
# ============================================================

if __name__ == "__main__":

    start_monitoring()