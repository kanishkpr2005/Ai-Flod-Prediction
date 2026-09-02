from datetime import datetime, timedelta

from fastapi import APIRouter
from pydantic import BaseModel

try:
    from .database import SessionLocal
    from .models import Alert
except ImportError:
    from database import SessionLocal
    from models import Alert


router = APIRouter()


# ============================================================
# REQUEST
# ============================================================

class AlertRequest(BaseModel):

    title: str
    message: str
    location: str
    severity: str

    disaster_type: str = "general"

    expiry_hours: int = 6

    latitude: float | None = None
    longitude: float | None = None


# ============================================================
# SERIALIZER
# ============================================================

def serialize_alert(alert):

    return {
        "id": alert.id,
        "title": alert.title,
        "message": alert.message,
        "location": alert.location,
        "latitude": alert.latitude,
        "longitude": alert.longitude,
        "severity": alert.severity,
        "status": alert.status,
        "created_at": alert.created_at,
        "expires_at": alert.expires_at,
        "disaster_type": alert.disaster_type,
    }


# ============================================================
# EXPIRE
# ============================================================

def update_expired_alerts(db):

    now = datetime.utcnow()

    alerts = (
        db.query(Alert)
        .filter(
            Alert.status == "ACTIVE",
            Alert.expires_at.isnot(None),
            Alert.expires_at <= now,
        )
        .all()
    )

    for alert in alerts:
        alert.status = "EXPIRED"

    if alerts:
        db.commit()


# ============================================================
# AUTOMATIC FLOOD ALERT
# ============================================================

def create_automatic_flood_alert(
    state,
    district,
    latitude,
    longitude,
    final_probability,
    risk_level,
):

    db = SessionLocal()

    try:

        update_expired_alerts(db)

        risk_level = str(
            risk_level
        ).upper()

        location = (
            f"{district}, {state}"
        )

        # ----------------------------------------------------
        # LOW
        # ----------------------------------------------------

        if risk_level == "LOW":

            active = (
                db.query(Alert)
                .filter(
                    Alert.location == location,
                    Alert.disaster_type == "flood",
                    Alert.status == "ACTIVE",
                )
                .all()
            )

            for alert in active:
                alert.status = "RESOLVED"

            if active:
                db.commit()

            return {
                "created": False,
                "duplicate": False,
                "resolved": bool(active),
                "message": (
                    "Flood alert resolved because risk is LOW"
                ),
            }

        # ----------------------------------------------------
        # MEDIUM
        # ----------------------------------------------------

        if risk_level == "MEDIUM":

            existing = (
                db.query(Alert)
                .filter(
                    Alert.location == location,
                    Alert.disaster_type == "flood",
                    Alert.status == "ACTIVE",
                )
                .first()
            )

            if existing:

                existing.message = (
                    f"AI flood monitoring continues "
                    f"for {district}, {state}. "
                    f"Current flood probability: "
                    f"{final_probability * 100:.1f}%."
                )

                existing.severity = "MEDIUM"

                existing.expires_at = (
                    datetime.utcnow()
                    + timedelta(hours=6)
                )

                db.commit()

                return {
                    "created": False,
                    "duplicate": True,
                    "resolved": False,
                    "alert_id": existing.id,
                }

            return {
                "created": False,
                "duplicate": False,
                "resolved": False,
                "message": (
                    "MEDIUM risk - monitoring only"
                ),
            }

        # ----------------------------------------------------
        # HIGH / CRITICAL
        # ----------------------------------------------------

        if risk_level not in [
            "HIGH",
            "CRITICAL",
        ]:

            return {
                "created": False,
                "duplicate": False,
                "resolved": False,
                "message": "No alert required",
            }

        probability_percent = (
            float(final_probability) * 100
        )

        existing = (
            db.query(Alert)
            .filter(
                Alert.location == location,
                Alert.disaster_type == "flood",
                Alert.status == "ACTIVE",
            )
            .first()
        )

        message = (
            f"AI flood monitoring system has detected "
            f"a {risk_level} flood risk in "
            f"{district}, {state}. "
            f"Estimated flood probability is "
            f"{probability_percent:.1f}%. "
            f"Immediate monitoring is recommended."
        )

        expires_at = (
            datetime.utcnow()
            + timedelta(hours=6)
        )

        # ----------------------------------------------------
        # UPDATE EXISTING
        # ----------------------------------------------------

        if existing:

            existing.message = message
            existing.severity = risk_level

            existing.latitude = float(
                latitude
            )

            existing.longitude = float(
                longitude
            )

            existing.expires_at = expires_at

            db.commit()
            db.refresh(existing)

            return {
                "created": False,
                "duplicate": True,
                "resolved": False,
                "alert_id": existing.id,
            }

        # ----------------------------------------------------
        # CREATE
        # ----------------------------------------------------

        alert = Alert(
            title=(
                f"Flood Risk Alert - {district}"
            ),
            message=message,
            location=location,
            latitude=float(latitude),
            longitude=float(longitude),
            severity=risk_level,
            status="ACTIVE",
            disaster_type="flood",
            created_at=datetime.utcnow(),
            expires_at=expires_at,
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        print(
            f"🚨 ALERT CREATED: "
            f"{location} | {risk_level} | "
            f"{probability_percent:.1f}%"
        )

        return {
            "created": True,
            "duplicate": False,
            "resolved": False,
            "alert_id": alert.id,
        }

    except Exception as error:

        db.rollback()

        print(
            f"Automatic alert error: {error}"
        )

        return {
            "created": False,
            "duplicate": False,
            "resolved": False,
            "error": str(error),
        }

    finally:

        db.close()


# ============================================================
# CREATE MANUAL ALERT
# ============================================================

@router.post("/alerts")
def create_alert(
    request: AlertRequest,
):

    db = SessionLocal()

    try:

        update_expired_alerts(db)

        existing = (
            db.query(Alert)
            .filter(
                Alert.location == request.location,
                Alert.severity == request.severity,
                Alert.disaster_type
                == request.disaster_type,
                Alert.status == "ACTIVE",
            )
            .first()
        )

        if existing:

            return {
                "success": True,
                "duplicate": True,
                "alert": serialize_alert(existing),
            }

        created = datetime.utcnow()

        alert = Alert(
            title=request.title,
            message=request.message,
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude,
            severity=request.severity.upper(),
            status="ACTIVE",
            disaster_type=request.disaster_type,
            created_at=created,
            expires_at=(
                created
                + timedelta(
                    hours=request.expiry_hours
                )
            ),
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        return {
            "success": True,
            "duplicate": False,
            "alert": serialize_alert(alert),
        }

    finally:

        db.close()


# ============================================================
# ACTIVE ALERTS
# ============================================================

@router.get("/alerts")
def get_alerts():

    db = SessionLocal()

    try:

        update_expired_alerts(db)

        alerts = (
            db.query(Alert)
            .filter(
                Alert.status == "ACTIVE"
            )
            .order_by(
                Alert.created_at.desc()
            )
            .all()
        )

        return {
            "total_alerts": len(alerts),
            "alerts": [
                serialize_alert(a)
                for a in alerts
            ],
        }

    finally:

        db.close()


# ============================================================
# ALERT HISTORY
# ============================================================

@router.get("/alerts/history")
def alert_history():

    db = SessionLocal()

    try:

        update_expired_alerts(db)

        alerts = (
            db.query(Alert)
            .order_by(
                Alert.created_at.desc()
            )
            .all()
        )

        return {
            "total_alerts": len(alerts),
            "alerts": [
                serialize_alert(a)
                for a in alerts
            ],
        }

    finally:

        db.close()


# ============================================================
# SINGLE ALERT
# ============================================================

@router.get("/alerts/{alert_id}")
def get_alert(
    alert_id: int,
):

    db = SessionLocal()

    try:

        update_expired_alerts(db)

        alert = (
            db.query(Alert)
            .filter(
                Alert.id == alert_id
            )
            .first()
        )

        if not alert:

            return {
                "success": False,
                "message": "Alert not found",
            }

        return {
            "success": True,
            "alert": serialize_alert(alert),
        }

    finally:

        db.close()


# ============================================================
# RESOLVE
# ============================================================

@router.patch(
    "/alerts/{alert_id}/resolve"
)
def resolve_alert(
    alert_id: int,
):

    db = SessionLocal()

    try:

        alert = (
            db.query(Alert)
            .filter(
                Alert.id == alert_id
            )
            .first()
        )

        if not alert:

            return {
                "success": False,
                "message": "Alert not found",
            }

        alert.status = "RESOLVED"

        db.commit()
        db.refresh(alert)

        return {
            "success": True,
            "message": "Alert resolved",
            "alert": serialize_alert(alert),
        }

    finally:

        db.close()