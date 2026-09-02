from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from database import SessionLocal
from models import Alert

from weather_service import get_weather_and_risk


# ==================================================
# RISK LEVELS THAT CREATE AUTOMATIC ALERTS
# ==================================================

ALERT_LEVELS = {
    "HIGH",
    "CRITICAL",
}


# ==================================================
# ALERT EXPIRY
# ==================================================

ALERT_EXPIRY_HOURS = 6


# ==================================================
# CREATE / UPDATE AUTOMATIC ALERT
# ==================================================

def create_automatic_alert(
    latitude: float,
    longitude: float,
    location_name: str = "Unknown Location",
):
    """
    Fetch live weather + forecast,
    calculate flood risk,
    and manage the automatic flood alert lifecycle.

    HIGH / CRITICAL
        -> Create or update ACTIVE alert

    LOW / MODERATE
        -> Resolve existing automatic flood alert
    """

    # ==================================================
    # GET WEATHER + FORECAST + RISK
    # ==================================================

    weather_result = get_weather_and_risk(
        latitude,
        longitude
    )

    risk = weather_result["risk"]

    risk_level = risk["risk_level"]
    risk_score = risk["risk_score"]

    forecast = weather_result.get(
        "forecast",
        {}
    )

    # ==================================================
    # FORECAST INFORMATION
    # ==================================================

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

    # ==================================================
    # OPEN DATABASE
    # ==================================================

    db: Session = SessionLocal()

    try:

        # ==================================================
        # LOW / MODERATE RISK
        # AUTOMATICALLY RESOLVE ACTIVE FLOOD ALERT
        # ==================================================

        if risk_level not in ALERT_LEVELS:

            active_alerts = (
                db.query(Alert)
                .filter(
                    Alert.location == location_name,
                    Alert.disaster_type == "flood",
                    Alert.status == "ACTIVE"
                )
                .all()
            )

            resolved_count = 0

            for existing_alert in active_alerts:

                existing_alert.status = "RESOLVED"

                resolved_count += 1

            if resolved_count > 0:

                db.commit()

                message = (
                    f"Flood risk in {location_name} "
                    f"has improved to {risk_level}. "
                    f"Active flood alert automatically resolved."
                )

            else:

                message = (
                    "No automatic alert required."
                )

            return {

                "alert_created": False,

                "alert_resolved":
                    resolved_count > 0,

                "resolved_count":
                    resolved_count,

                "message":
                    message,

                "risk":
                    risk,

                "forecast":
                    forecast,

                "location": {

                    "name":
                        location_name,

                    "latitude":
                        latitude,

                    "longitude":
                        longitude,
                },
            }

        # ==================================================
        # PREPARE ALERT
        # ==================================================

        title = (
            f"{risk_level} FLOOD RISK ALERT"
        )

        factors = risk.get(
            "factors",
            []
        )

        factor_text = ", ".join(
            factors
        )

        # ==================================================
        # ALERT MESSAGE
        # ==================================================

        message = (

            f"Automatic flood risk detected "
            f"in {location_name}. "

            f"Risk score: "
            f"{risk_score}/100. "

            f"Expected rainfall in next 6 hours: "
            f"{forecast_rainfall} mm. "

            f"Maximum hourly rainfall forecast: "
            f"{maximum_hourly_rainfall} mm. "

            f"Maximum rain probability: "
            f"{maximum_rain_probability}%. "

            f"Risk factors: "
            f"{factor_text}. "

            f"{risk['recommendation']}"
        )

        # ==================================================
        # CHECK ACTIVE AUTOMATIC FLOOD ALERT
        # ==================================================

        existing_alert = (
            db.query(Alert)
            .filter(
                Alert.location == location_name,
                Alert.disaster_type == "flood",
                Alert.status == "ACTIVE"
            )
            .first()
        )

        # ==================================================
        # EXISTING ACTIVE ALERT
        # UPDATE IT
        # ==================================================

        if existing_alert:

            existing_alert.title = title

            existing_alert.message = message

            existing_alert.severity = risk_level

            # IMPORTANT:
            # Keep the latest geographic coordinates
            existing_alert.latitude = latitude
            existing_alert.longitude = longitude

            existing_alert.created_at = datetime.utcnow()

            existing_alert.expires_at = (
                datetime.utcnow()
                + timedelta(
                    hours=ALERT_EXPIRY_HOURS
                )
            )

            db.commit()

            db.refresh(
                existing_alert
            )

            return {

                "alert_created":
                    False,

                "alert_updated":
                    True,

                "duplicate":
                    True,

                "message":
                    "Existing automatic flood alert updated.",

                "alert": {

                    "id":
                        existing_alert.id,

                    "title":
                        existing_alert.title,

                    "message":
                        existing_alert.message,

                    "location":
                        existing_alert.location,

                    "latitude":
                        existing_alert.latitude,

                    "longitude":
                        existing_alert.longitude,

                    "severity":
                        existing_alert.severity,

                    "status":
                        existing_alert.status,

                    "created_at":
                        existing_alert.created_at,

                    "expires_at":
                        existing_alert.expires_at,

                    "disaster_type":
                        existing_alert.disaster_type,
                },

                "risk":
                    risk,

                "forecast":
                    forecast,
            }

        # ==================================================
        # CREATE NEW AUTOMATIC ALERT
        # ==================================================

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

            location=location_name,

            # ==================================================
            # SAVE MAP COORDINATES
            # ==================================================

            latitude=latitude,

            longitude=longitude,

            severity=risk_level,

            status="ACTIVE",

            created_at=created_at,

            expires_at=expires_at,

            disaster_type="flood",
        )

        db.add(
            new_alert
        )

        db.commit()

        db.refresh(
            new_alert
        )

        # ==================================================
        # RETURN CREATED ALERT
        # ==================================================

        return {

            "alert_created":
                True,

            "alert_updated":
                False,

            "duplicate":
                False,

            "message":
                "Automatic disaster alert created successfully.",

            "alert": {

                "id":
                    new_alert.id,

                "title":
                    new_alert.title,

                "message":
                    new_alert.message,

                "location":
                    new_alert.location,

                "latitude":
                    new_alert.latitude,

                "longitude":
                    new_alert.longitude,

                "severity":
                    new_alert.severity,

                "status":
                    new_alert.status,

                "created_at":
                    new_alert.created_at,

                "expires_at":
                    new_alert.expires_at,

                "disaster_type":
                    new_alert.disaster_type,
            },

            "risk":
                risk,

            "forecast":
                forecast,
        }

    finally:

        db.close()


# ==================================================
# MANUAL TEST
# ==================================================

if __name__ == "__main__":

    # --------------------------------------------------
    # Delhi coordinates
    # --------------------------------------------------

    latitude = 28.6139

    longitude = 77.2090

    result = create_automatic_alert(

        latitude=latitude,

        longitude=longitude,

        location_name="Delhi",
    )

    # ==================================================
    # PRINT RESULT
    # ==================================================

    print(
        "\n=============================="
    )

    print(
        "AUTOMATIC ALERT TEST"
    )

    print(
        "=============================="
    )

    print(
        f"Alert Created: "
        f"{result.get('alert_created', False)}"
    )

    print(
        f"Alert Updated: "
        f"{result.get('alert_updated', False)}"
    )

    print(
        f"Alert Resolved: "
        f"{result.get('alert_resolved', False)}"
    )

    if result.get(
        "duplicate"
    ):

        print(
            "Duplicate: Yes"
        )

    print(
        f"Risk Level: "
        f"{result['risk']['risk_level']}"
    )

    print(
        f"Risk Score: "
        f"{result['risk']['risk_score']}/100"
    )

    # ==================================================
    # FORECAST
    # ==================================================

    forecast = result.get(
        "forecast",
        {}
    )

    print(
        f"Forecast Rainfall: "
        f"{forecast.get('total_rainfall_mm', 0)} mm"
    )

    print(
        f"Maximum Hourly Rainfall: "
        f"{forecast.get('maximum_hourly_rainfall_mm', 0)} mm"
    )

    print(
        f"Maximum Rain Probability: "
        f"{forecast.get('maximum_rain_probability', 0)}%"
    )

    print(
        f"Message: "
        f"{result['message']}"
    )

    # ==================================================
    # ALERT DETAILS
    # ==================================================

    if result.get(
        "alert"
    ):

        print(
            "\nAlert Details:"
        )

        print(
            f"ID: "
            f"{result['alert']['id']}"
        )

        print(
            f"Title: "
            f"{result['alert']['title']}"
        )

        print(
            f"Location: "
            f"{result['alert']['location']}"
        )

        print(
            f"Latitude: "
            f"{result['alert']['latitude']}"
        )

        print(
            f"Longitude: "
            f"{result['alert']['longitude']}"
        )

        print(
            f"Severity: "
            f"{result['alert']['severity']}"
        )

        print(
            f"Status: "
            f"{result['alert']['status']}"
        )

        print(
            f"Created At: "
            f"{result['alert']['created_at']}"
        )

        print(
            f"Expires At: "
            f"{result['alert']['expires_at']}"
        )

        print(
            f"Disaster Type: "
            f"{result['alert']['disaster_type']}"
        )