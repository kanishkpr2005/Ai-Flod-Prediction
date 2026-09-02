import os
from datetime import datetime, timedelta

import pandas as pd

from database import SessionLocal
from models import Alert


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

PREDICTION_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "latest_district_predictions.csv"
)


# ============================================================
# CONFIGURATION
# ============================================================

ALERT_LEVELS = {
    "HIGH",
    "CRITICAL",
}

ALERT_EXPIRY_HOURS = 6


# ============================================================
# LOAD PREDICTIONS
# ============================================================

def load_predictions():

    print()
    print("=" * 70)
    print("LOADING DISTRICT PREDICTIONS")
    print("=" * 70)

    print()
    print(
        f"Prediction file:\n{PREDICTION_FILE}"
    )

    if not os.path.exists(PREDICTION_FILE):

        raise FileNotFoundError(
            f"\nPrediction file not found:\n"
            f"{PREDICTION_FILE}"
        )

    df = pd.read_csv(
        PREDICTION_FILE
    )

    required_columns = [
        "state",
        "district",
        "flood_probability",
        "risk_level",
    ]

    missing = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing:

        raise ValueError(
            "Missing required columns: "
            + ", ".join(missing)
        )

    # --------------------------------------------------------
    # Clean state
    # --------------------------------------------------------

    df["state"] = (
        df["state"]
        .astype(str)
        .str.strip()
    )

    # --------------------------------------------------------
    # Clean district
    # --------------------------------------------------------

    df["district"] = (
        df["district"]
        .astype(str)
        .str.strip()
    )

    # --------------------------------------------------------
    # Convert probability
    # --------------------------------------------------------

    df["flood_probability"] = pd.to_numeric(
        df["flood_probability"],
        errors="coerce"
    ).fillna(0.0)

    # --------------------------------------------------------
    # Handle probability format
    #
    # If values are 0-1:
    #     0.288 -> 28.8%
    #
    # If values are already 0-100:
    #     28.8 -> 28.8%
    # --------------------------------------------------------

    if (
        len(df) > 0
        and df["flood_probability"].max() <= 1.0
    ):

        df["flood_probability"] = (
            df["flood_probability"] * 100
        )

    # Keep probability between 0 and 100

    df["flood_probability"] = (
        df["flood_probability"]
        .clip(0, 100)
    )

    # --------------------------------------------------------
    # Clean risk level
    # --------------------------------------------------------

    df["risk_level"] = (
        df["risk_level"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    # --------------------------------------------------------
    # Optional rainfall columns
    # --------------------------------------------------------

    optional_columns = [
        "rainfall_1d",
        "rainfall_3d",
        "rainfall_7d",
        "rainfall_30d",
    ]

    for column in optional_columns:

        if column not in df.columns:

            df[column] = 0.0

        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        ).fillna(0.0)

    # --------------------------------------------------------
    # Remove invalid district rows
    # --------------------------------------------------------

    df = df[
        (df["state"].str.len() > 0)
        & (df["district"].str.len() > 0)
    ].copy()

    df.reset_index(
        drop=True,
        inplace=True
    )

    print()
    print(
        f"Valid districts loaded: {len(df)}"
    )

    if len(df) == 590:

        print(
            "SUCCESS: ALL 590 DISTRICTS LOADED!"
        )

    else:

        print(
            f"WARNING: Expected 590 districts, "
            f"found {len(df)}"
        )

    return df


# ============================================================
# PROCESS ONE DISTRICT
# ============================================================

def process_district(
    db,
    row
):

    # --------------------------------------------------------
    # Basic district information
    # --------------------------------------------------------

    state = str(
        row["state"]
    ).strip()

    district = str(
        row["district"]
    ).strip()

    probability = float(
        row["flood_probability"]
    )

    risk_level = str(
        row["risk_level"]
    ).strip().upper()

    location = district

    # --------------------------------------------------------
    # Rainfall information
    # --------------------------------------------------------

    rainfall_1d = float(
        row.get(
            "rainfall_1d",
            0.0
        )
    )

    rainfall_3d = float(
        row.get(
            "rainfall_3d",
            0.0
        )
    )

    rainfall_7d = float(
        row.get(
            "rainfall_7d",
            0.0
        )
    )

    rainfall_30d = float(
        row.get(
            "rainfall_30d",
            0.0
        )
    )

    # ========================================================
    # FIND EXISTING ACTIVE FLOOD ALERT
    # ========================================================

    existing_alert = (
        db.query(Alert)
        .filter(
            Alert.location == location,
            Alert.disaster_type == "flood",
            Alert.status == "ACTIVE"
        )
        .first()
    )

    # ========================================================
    # LOW / MODERATE
    # ========================================================
    #
    # No new alert.
    #
    # If an old automatic alert exists:
    # resolve it.
    # ========================================================

    if risk_level not in ALERT_LEVELS:

        if existing_alert:

            existing_alert.status = "RESOLVED"

            existing_alert.expires_at = (
                datetime.utcnow()
            )

            return "RESOLVED"

        return "NO_ALERT"

    # ========================================================
    # ALERT TITLE
    # ========================================================

    title = (
        f"{risk_level} FLOOD RISK - "
        f"{district}"
    )

    # ========================================================
    # ALERT MESSAGE
    # ========================================================

    message = (

        f"Automatic flood risk detected in "
        f"{district}, {state}. "

        f"Flood probability: "
        f"{probability:.1f}%. "

        f"Risk level: "
        f"{risk_level}. "

        f"Rainfall 1-day: "
        f"{rainfall_1d:.2f} mm. "

        f"Rainfall 3-day: "
        f"{rainfall_3d:.2f} mm. "

        f"Rainfall 7-day: "
        f"{rainfall_7d:.2f} mm. "

        f"Rainfall 30-day: "
        f"{rainfall_30d:.2f} mm."
    )

    # ========================================================
    # UPDATE EXISTING ACTIVE ALERT
    # ========================================================

    if existing_alert:

        existing_alert.title = title

        existing_alert.message = message

        existing_alert.severity = risk_level

        existing_alert.created_at = (
            datetime.utcnow()
        )

        existing_alert.expires_at = (
            datetime.utcnow()
            + timedelta(
                hours=ALERT_EXPIRY_HOURS
            )
        )

        return "UPDATED"

    # ========================================================
    # CREATE NEW ALERT
    # ========================================================

    created_at = datetime.utcnow()

    expires_at = (
        created_at
        + timedelta(
            hours=ALERT_EXPIRY_HOURS
        )
    )

    new_alert = Alert(

        title=title,

        message=message,

        location=location,

        severity=risk_level,

        status="ACTIVE",

        created_at=created_at,

        expires_at=expires_at,

        disaster_type="flood",
    )

    db.add(
        new_alert
    )

    return "CREATED"


# ============================================================
# MAIN DISTRICT ALERT ENGINE
# ============================================================

def run_district_alert_engine():

    print()
    print("=" * 80)
    print("AUTOMATIC DISTRICT FLOOD ALERT ENGINE")
    print("=" * 80)

    # ========================================================
    # LOAD PREDICTIONS
    # ========================================================

    print()
    print(
        "Loading district predictions..."
    )

    df = load_predictions()

    print()
    print(
        f"Districts to process: {len(df)}"
    )

    # ========================================================
    # OPEN DATABASE
    # ========================================================

    db = SessionLocal()

    created = 0
    updated = 0
    resolved = 0
    no_alert = 0
    errors = 0

    print()
    print(
        "Processing automatic alerts..."
    )

    try:

        # ====================================================
        # PROCESS EACH DISTRICT
        # ====================================================

        for index, row in df.iterrows():

            district = str(
                row["district"]
            ).strip()

            try:

                result = process_district(
                    db,
                    row
                )

                # --------------------------------------------
                # Count result
                # --------------------------------------------

                if result == "CREATED":

                    created += 1

                elif result == "UPDATED":

                    updated += 1

                elif result == "RESOLVED":

                    resolved += 1

                elif result == "NO_ALERT":

                    no_alert += 1

                # --------------------------------------------
                # Progress
                # --------------------------------------------

                if (
                    (index + 1) % 25 == 0
                    or index + 1 == len(df)
                ):

                    print(
                        f"Processed "
                        f"{index + 1}/{len(df)} "
                        f"| Latest: {district}"
                    )

            except Exception as error:

                errors += 1

                print()
                print(
                    f"ERROR processing "
                    f"{district}: {error}"
                )

        # ====================================================
        # COMMIT ALL CHANGES
        # ====================================================

        db.commit()

    except Exception:

        db.rollback()

        raise

    finally:

        db.close()

    # ========================================================
    # FINAL SUMMARY
    # ========================================================

    print()
    print("=" * 80)
    print("AUTOMATIC ALERT ENGINE COMPLETE")
    print("=" * 80)

    print()
    print(
        f"Total districts : {len(df)}"
    )

    print(
        f"Alerts created  : {created}"
    )

    print(
        f"Alerts updated  : {updated}"
    )

    print(
        f"Alerts resolved : {resolved}"
    )

    print(
        f"No alert needed : {no_alert}"
    )

    print(
        f"Processing errors: {errors}"
    )

    print()
    print(
        "Database:"
    )

    print(
        os.path.join(
            BASE_DIR,
            "backend",
            "disaster.db"
        )
    )

    print()
    print(
        "=" * 80
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    run_district_alert_engine()