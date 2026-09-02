from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

try:
    from .database import get_db
    from .models import (
        Disaster,
        SOSRequest,
        Alert,
        RescueTeam,
        Volunteer,
    )
except ImportError:
    from database import get_db
    from models import (
        Disaster,
        SOSRequest,
        Alert,
        RescueTeam,
        Volunteer,
    )


router = APIRouter()


# ============================================================
# AUTHORITY DASHBOARD
# ============================================================

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db)
):

    # ========================================================
    # DISASTERS
    # ========================================================

    total_disasters = (
        db.query(Disaster)
        .count()
    )

    flood_count = (
        db.query(Disaster)
        .filter(
            func.lower(
                Disaster.disaster_type
            ) == "flood"
        )
        .count()
    )

    high_disasters = (
        db.query(Disaster)
        .filter(
            func.lower(
                Disaster.severity
            ) == "high"
        )
        .count()
    )

    medium_disasters = (
        db.query(Disaster)
        .filter(
            func.lower(
                Disaster.severity
            ) == "medium"
        )
        .count()
    )

    low_disasters = (
        db.query(Disaster)
        .filter(
            func.lower(
                Disaster.severity
            ) == "low"
        )
        .count()
    )


    # ========================================================
    # ALERTS
    # ========================================================

    total_alerts = (
        db.query(Alert)
        .count()
    )

    active_alerts = (
        db.query(Alert)
        .filter(
            func.upper(
                Alert.status
            ) == "ACTIVE"
        )
        .count()
    )

    critical_alerts = (
        db.query(Alert)
        .filter(
            func.upper(
                Alert.severity
            ) == "CRITICAL"
        )
        .count()
    )

    high_alerts = (
        db.query(Alert)
        .filter(
            func.upper(
                Alert.severity
            ) == "HIGH"
        )
        .count()
    )

    medium_alerts = (
        db.query(Alert)
        .filter(
            func.upper(
                Alert.severity
            ) == "MEDIUM"
        )
        .count()
    )


    # ========================================================
    # SOS
    # ========================================================

    total_sos = (
        db.query(SOSRequest)
        .count()
    )

    critical_sos = (
        db.query(SOSRequest)
        .filter(
            func.upper(
                SOSRequest.priority
            ) == "CRITICAL"
        )
        .count()
    )

    high_sos = (
        db.query(SOSRequest)
        .filter(
            func.upper(
                SOSRequest.priority
            ) == "HIGH"
        )
        .count()
    )

    medium_sos = (
        db.query(SOSRequest)
        .filter(
            func.upper(
                SOSRequest.priority
            ) == "MEDIUM"
        )
        .count()
    )


    # ========================================================
    # RESCUE TEAMS
    # ========================================================

    total_rescue_teams = (
        db.query(RescueTeam)
        .count()
    )

    available_rescue_teams = (
        db.query(RescueTeam)
        .filter(
            func.lower(
                RescueTeam.status
            ) == "available"
        )
        .count()
    )

    deployed_rescue_teams = (
        db.query(RescueTeam)
        .filter(
            func.lower(
                RescueTeam.status
            ) == "deployed"
        )
        .count()
    )

    total_rescue_members = (
        db.query(
            func.coalesce(
                func.sum(
                    RescueTeam.members
                ),
                0
            )
        )
        .scalar()
    )

    if total_rescue_members is None:

        total_rescue_members = 0


    # ========================================================
    # VOLUNTEERS
    # ========================================================

    total_volunteers = (
        db.query(Volunteer)
        .count()
    )

    available_volunteers = (
        db.query(Volunteer)
        .filter(
            func.lower(
                Volunteer.status
            ) == "available"
        )
        .count()
    )

    deployed_volunteers = (
        db.query(Volunteer)
        .filter(
            func.lower(
                Volunteer.status
            ) == "deployed"
        )
        .count()
    )


    # ========================================================
    # RECENT ALERTS
    # ========================================================

    recent_alerts = (
        db.query(Alert)
        .order_by(
            Alert.id.desc()
        )
        .limit(10)
        .all()
    )

    alerts_data = []

    for alert in recent_alerts:

        alerts_data.append({

            "id":
                alert.id,

            "title":
                alert.title,

            "message":
                alert.message,

            "location":
                alert.location,

            "latitude":
                alert.latitude,

            "longitude":
                alert.longitude,

            "severity":
                alert.severity,

            "status":
                alert.status,

            "disaster_type":
                alert.disaster_type,

            "created_at":
                (
                    alert.created_at.isoformat()
                    if alert.created_at
                    else None
                ),

            "expires_at":
                (
                    alert.expires_at.isoformat()
                    if alert.expires_at
                    else None
                )
        })


    # ========================================================
    # RECENT SOS
    # ========================================================

    recent_sos = (
        db.query(SOSRequest)
        .order_by(
            SOSRequest.id.desc()
        )
        .limit(10)
        .all()
    )

    sos_data = []

    for sos in recent_sos:

        sos_data.append({

            "id":
                sos.id,

            "name":
                sos.name,

            "location":
                sos.location,

            "people":
                sos.people,

            "emergency":
                sos.emergency,

            "priority":
                sos.priority,

            "latitude":
                sos.latitude,

            "longitude":
                sos.longitude
        })


    # ========================================================
    # RECENT DISASTERS
    # ========================================================

    recent_disasters = (
        db.query(Disaster)
        .order_by(
            Disaster.id.desc()
        )
        .limit(10)
        .all()
    )

    disasters_data = []

    for disaster in recent_disasters:

        disasters_data.append({

            "id":
                disaster.id,

            "disaster_type":
                disaster.disaster_type,

            "location":
                disaster.location,

            "severity":
                disaster.severity,

            "latitude":
                disaster.latitude,

            "longitude":
                disaster.longitude,

            "description":
                disaster.description
        })


    # ========================================================
    # RESCUE TEAMS
    # ========================================================

    rescue_teams = (
        db.query(RescueTeam)
        .order_by(
            RescueTeam.id.desc()
        )
        .limit(20)
        .all()
    )

    rescue_data = []

    for team in rescue_teams:

        rescue_data.append({

            "id":
                team.id,

            "name":
                team.name,

            "contact":
                team.contact,

            "location":
                team.location,

            "specialization":
                team.specialization,

            "members":
                team.members,

            "status":
                team.status
        })


    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        "status":
            "success",

        "overview": {

            "total_disasters":
                total_disasters,

            "total_alerts":
                total_alerts,

            "active_alerts":
                active_alerts,

            "total_sos":
                total_sos,

            "total_rescue_teams":
                total_rescue_teams,

            "available_rescue_teams":
                available_rescue_teams,

            "total_rescue_members":
                total_rescue_members,

            "total_volunteers":
                total_volunteers,

            "available_volunteers":
                available_volunteers
        },

        "disasters": {

            "total":
                total_disasters,

            "flood":
                flood_count,

            "high":
                high_disasters,

            "medium":
                medium_disasters,

            "low":
                low_disasters
        },

        "alerts": {

            "total":
                total_alerts,

            "active":
                active_alerts,

            "critical":
                critical_alerts,

            "high":
                high_alerts,

            "medium":
                medium_alerts
        },

        "sos": {

            "total":
                total_sos,

            "critical":
                critical_sos,

            "high":
                high_sos,

            "medium":
                medium_sos
        },

        "rescue": {

            "total_teams":
                total_rescue_teams,

            "available_teams":
                available_rescue_teams,

            "deployed_teams":
                deployed_rescue_teams,

            "total_members":
                total_rescue_members
        },

        "volunteers": {

            "total":
                total_volunteers,

            "available":
                available_volunteers,

            "deployed":
                deployed_volunteers
        },

        "recent_alerts":
            alerts_data,

        "recent_sos":
            sos_data,

        "recent_disasters":
            disasters_data,

        "rescue_teams":
            rescue_data
    }