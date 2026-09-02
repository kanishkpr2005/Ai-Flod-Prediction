from datetime import datetime
from math import radians, sin, cos, sqrt, atan2

from fastapi import APIRouter
from pydantic import BaseModel

try:
    from .database import SessionLocal
    from .models import (
        SOSRequest,
        ResponseUnit,
        ResponseTeam,
    )
except ImportError:
    from database import SessionLocal
    from models import (
        SOSRequest,
        ResponseUnit,
        ResponseTeam,
    )


router = APIRouter()

ACTIVE_SOS_STATUSES = [
    "PENDING",
    "ASSIGNED",
    "IN_PROGRESS",
]

HANDLED_SOS_STATUSES = [
    "RESOLVED",
    "CANCELLED",
]


# ============================================================
# REQUEST MODELS
# ============================================================

class OneTapSOS(BaseModel):

    name: str = "Emergency User"

    phone: str | None = None

    latitude: float

    longitude: float

    location: str = "Current GPS Location"

    people: int = 1


class DetailedSOS(BaseModel):

    name: str

    phone: str | None = None

    latitude: float

    longitude: float

    location: str

    emergency: str

    description: str | None = None

    people: int = 1

    priority: str = "HIGH"


# ============================================================
# DISTANCE
# ============================================================

def distance_km(
    lat1,
    lon1,
    lat2,
    lon2,
):

    R = 6371.0

    dlat = radians(
        lat2 - lat1
    )

    dlon = radians(
        lon2 - lon1
    )

    a = (
        sin(dlat / 2) ** 2
        +
        cos(radians(lat1))
        * cos(radians(lat2))
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a),
    )

    return R * c


# ============================================================
# SERIALIZER
# ============================================================

def serialize_sos(sos):

    return {
        "id": sos.id,
        "name": sos.name,
        "phone": sos.phone,
        "location": sos.location,
        "latitude": sos.latitude,
        "longitude": sos.longitude,
        "emergency": sos.emergency,
        "description": sos.description,
        "people": sos.people,
        "priority": sos.priority,
        "status": sos.status,
        "assigned_unit_id": sos.assigned_unit_id,
        "assigned_team_id": sos.assigned_team_id,
        "created_at": sos.created_at,
        "resolved_at": sos.resolved_at,
    }


# ============================================================
# FIND NEAREST RESPONSE UNIT
# ============================================================

def assign_nearest_unit(
    db,
    latitude,
    longitude,
    sos_id,
):

    units = (
        db.query(ResponseUnit)
        .filter(
            ResponseUnit.status
            == "AVAILABLE"
        )
        .all()
    )

    best_unit = None
    best_distance = None

    for unit in units:

        if (
            unit.latitude is None
            or unit.longitude is None
        ):
            continue

        d = distance_km(
            latitude,
            longitude,
            unit.latitude,
            unit.longitude,
        )

        if (
            best_distance is None
            or d < best_distance
        ):

            best_unit = unit
            best_distance = d

    if best_unit is None:

        return None

    best_unit.status = "ASSIGNED"
    best_unit.assigned_sos_id = sos_id

    return {
        "unit": best_unit,
        "distance_km": best_distance,
    }


# ============================================================
# FIND NEAREST RESPONSE TEAM
# ============================================================

def assign_nearest_team(
    db,
    latitude,
    longitude,
    sos_id,
):

    teams = (
        db.query(ResponseTeam)
        .filter(
            ResponseTeam.status
            == "AVAILABLE"
        )
        .all()
    )

    best_team = None
    best_distance = None

    for team in teams:

        if (
            team.latitude is None
            or team.longitude is None
        ):
            continue

        d = distance_km(
            latitude,
            longitude,
            team.latitude,
            team.longitude,
        )

        if (
            best_distance is None
            or d < best_distance
        ):

            best_team = team
            best_distance = d

    if best_team is None:

        return None

    best_team.status = "ASSIGNED"
    best_team.assigned_sos_id = sos_id

    return {
        "team": best_team,
        "distance_km": best_distance,
    }


# ============================================================
# CREATE SOS INTERNAL
# ============================================================

def create_sos(
    data,
    auto_assign=True,
):

    db = SessionLocal()

    try:

        sos = SOSRequest(
            name=data.name,
            phone=data.phone,
            location=data.location,
            latitude=data.latitude,
            longitude=data.longitude,
            emergency=getattr(
                data,
                "emergency",
                "GENERAL EMERGENCY",
            ),
            description=getattr(
                data,
                "description",
                "One-tap emergency SOS",
            ),
            people=max(
                1,
                int(data.people),
            ),
            priority=getattr(
                data,
                "priority",
                "HIGH",
            ).upper(),
            status="PENDING",
            created_at=datetime.utcnow(),
        )

        db.add(sos)
        db.commit()
        db.refresh(sos)

        assigned_unit = None
        assigned_team = None

        # ----------------------------------------------------
        # AUTO ASSIGN
        # ----------------------------------------------------

        if auto_assign:

            unit_result = assign_nearest_unit(
                db,
                data.latitude,
                data.longitude,
                sos.id,
            )

            if unit_result:

                unit = unit_result["unit"]

                sos.assigned_unit_id = unit.id

                assigned_unit = {
                    "id": unit.id,
                    "name": unit.name,
                    "unit_type": unit.unit_type,
                    "contact": unit.contact,
                    "distance_km": round(
                        unit_result[
                            "distance_km"
                        ],
                        2,
                    ),
                }

            team_result = assign_nearest_team(
                db,
                data.latitude,
                data.longitude,
                sos.id,
            )

            if team_result:

                team = team_result["team"]

                sos.assigned_team_id = team.id

                assigned_team = {
                    "id": team.id,
                    "name": team.name,
                    "team_type": team.team_type,
                    "contact": team.contact,
                    "distance_km": round(
                        team_result[
                            "distance_km"
                        ],
                        2,
                    ),
                }

            if (
                assigned_unit
                or assigned_team
            ):

                sos.status = "ASSIGNED"

        db.commit()
        db.refresh(sos)

        return {
            "success": True,
            "message": (
                "Emergency SOS registered successfully"
            ),
            "sos": serialize_sos(sos),
            "assigned_unit": assigned_unit,
            "assigned_team": assigned_team,
        }

    except Exception as error:

        db.rollback()

        return {
            "success": False,
            "message": str(error),
        }

    finally:

        db.close()


# ============================================================
# ONE TAP SOS
# ============================================================

@router.post("/sos/one-tap")
def one_tap_sos(
    request: OneTapSOS,
):

    return create_sos(
        request,
        auto_assign=True,
    )


# ============================================================
# DETAILED SOS
# ============================================================

@router.post("/sos")
def detailed_sos(
    request: DetailedSOS,
):

    return create_sos(
        request,
        auto_assign=True,
    )


# ============================================================
# GET ACTIVE SOS
# ============================================================

@router.get("/sos")
def get_sos():

    db = SessionLocal()

    try:

        records = (
            db.query(SOSRequest)
            .filter(
                ~SOSRequest.status.ilike("RESOLVED"),
                ~SOSRequest.status.ilike("CANCELLED"),
            )
            .order_by(
                SOSRequest.created_at.desc()
            )
            .all()
        )

        return {
            "total": len(records),
            "sos_requests": [
                serialize_sos(x)
                for x in records
            ],
        }

    finally:

        db.close()


# ============================================================
# SOS HANDLED HISTORY
# ============================================================

@router.get("/sos/handled")
def get_handled_sos():

    db = SessionLocal()

    try:

        records = (
            db.query(SOSRequest)
            .filter(
                SOSRequest.status.ilike("RESOLVED") |
                SOSRequest.status.ilike("CANCELLED")
            )
            .order_by(
                SOSRequest.resolved_at.desc(),
                SOSRequest.created_at.desc(),
            )
            .all()
        )

        return {
            "total": len(records),
            "sos_requests": [
                serialize_sos(x)
                for x in records
            ],
        }

    finally:

        db.close()


# ============================================================
# SOS HISTORY
# ============================================================

@router.get("/sos/history")
def sos_history():

    db = SessionLocal()

    try:

        records = (
            db.query(SOSRequest)
            .order_by(
                SOSRequest.created_at.desc()
            )
            .all()
        )

        return {
            "total": len(records),
            "sos_requests": [
                serialize_sos(x)
                for x in records
            ],
        }

    finally:

        db.close()


# ============================================================
# SINGLE SOS
# ============================================================

@router.get("/sos/{sos_id}")
def get_single_sos(
    sos_id: int,
):

    db = SessionLocal()

    try:

        sos = (
            db.query(SOSRequest)
            .filter(
                SOSRequest.id == sos_id
            )
            .first()
        )

        if not sos:

            return {
                "success": False,
                "message": "SOS not found",
            }

        return {
            "success": True,
            "sos": serialize_sos(sos),
        }

    finally:

        db.close()


# ============================================================
# UPDATE STATUS
# ============================================================

@router.patch("/sos/{sos_id}/status")
def update_sos_status(
    sos_id: int,
    status: str,
):

    db = SessionLocal()

    try:

        sos = (
            db.query(SOSRequest)
            .filter(
                SOSRequest.id == sos_id
            )
            .first()
        )

        if not sos:

            return {
                "success": False,
                "message": "SOS not found",
            }

        allowed = [
            "PENDING",
            "ASSIGNED",
            "IN_PROGRESS",
            "RESOLVED",
            "CANCELLED",
        ]

        status = status.upper()

        if status not in allowed:

            return {
                "success": False,
                "message": (
                    f"Invalid status. "
                    f"Allowed: {allowed}"
                ),
            }

        sos.status = status

        if status == "RESOLVED":

            sos.resolved_at = (
                datetime.utcnow()
            )

            # Release assigned unit
            if sos.assigned_unit_id:

                unit = (
                    db.query(ResponseUnit)
                    .filter(
                        ResponseUnit.id
                        == sos.assigned_unit_id
                    )
                    .first()
                )

                if unit:

                    unit.status = "AVAILABLE"
                    unit.assigned_sos_id = None

            # Release assigned team
            if sos.assigned_team_id:

                team = (
                    db.query(ResponseTeam)
                    .filter(
                        ResponseTeam.id
                        == sos.assigned_team_id
                    )
                    .first()
                )

                if team:

                    team.status = "AVAILABLE"
                    team.assigned_sos_id = None

        db.commit()
        db.refresh(sos)

        return {
            "success": True,
            "sos": serialize_sos(sos),
        }

    finally:

        db.close()