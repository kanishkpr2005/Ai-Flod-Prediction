from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from sqlalchemy.orm import Session

try:
    from .database import get_db
    from .models import ResponseUnit
except ImportError:
    from database import get_db
    from models import ResponseUnit


router = APIRouter()


# ============================================================
# REQUEST SCHEMAS
# ============================================================


class ResponseUnitCreate(BaseModel):

    name: str

    unit_type: str

    contact: str | None = None

    location: str | None = None

    latitude: float | None = None

    longitude: float | None = None

    status: str = "AVAILABLE"

    vehicle_number: str | None = None

    capacity: int = 1


class ResponseUnitStatusUpdate(BaseModel):

    status: str


class ResponseUnitAssignment(BaseModel):

    sos_id: int


# ============================================================
# SERIALIZER
# ============================================================


def serialize_unit(unit):

    return {

        "id": unit.id,

        "name": unit.name,

        "unit_type": unit.unit_type,

        "contact": unit.contact,

        "location": unit.location,

        "latitude": unit.latitude,

        "longitude": unit.longitude,

        "status": unit.status,

        "vehicle_number": unit.vehicle_number,

        "capacity": unit.capacity,

        "assigned_sos_id": unit.assigned_sos_id,

        "created_at": (
            unit.created_at.isoformat()
            if unit.created_at
            else None
        ),

    }


# ============================================================
# CREATE RESPONSE UNIT
# ============================================================


@router.post("/response-units")
def create_response_unit(

    request: ResponseUnitCreate,

    db: Session = Depends(get_db)

):

    unit_type = request.unit_type.upper()

    allowed_types = {

        "POLICE",

        "AMBULANCE",

    }

    if unit_type not in allowed_types:

        return {

            "success": False,

            "message":
                "Invalid unit type",

            "allowed_types":
                sorted(allowed_types),

        }

    status = request.status.upper()

    allowed_statuses = {

        "AVAILABLE",

        "ASSIGNED",

        "IN_TRANSIT",

        "BUSY",

        "OFFLINE",

    }

    if status not in allowed_statuses:

        return {

            "success": False,

            "message":
                "Invalid response unit status",

            "allowed_statuses":
                sorted(allowed_statuses),

        }

    if request.capacity < 1:

        return {

            "success": False,

            "message":
                "Capacity must be at least 1",

        }

    unit = ResponseUnit(

        name=request.name,

        unit_type=unit_type,

        contact=request.contact,

        location=request.location,

        latitude=request.latitude,

        longitude=request.longitude,

        status=status,

        vehicle_number=request.vehicle_number,

        capacity=request.capacity,

        created_at=datetime.utcnow(),

    )

    db.add(unit)

    db.commit()

    db.refresh(unit)

    return {

        "success": True,

        "message":
            "Response unit created successfully",

        "unit":
            serialize_unit(unit),

    }


# ============================================================
# GET ALL RESPONSE UNITS
# ============================================================


@router.get("/response-units")
def get_response_units(

    db: Session = Depends(get_db)

):

    units = (

        db.query(ResponseUnit)

        .order_by(
            ResponseUnit.id.desc()
        )

        .all()

    )

    return {

        "success": True,

        "count": len(units),

        "units": [

            serialize_unit(unit)

            for unit in units

        ],

        "response_units": [

            serialize_unit(unit)

            for unit in units

        ],

    }


# ============================================================
# GET AVAILABLE RESPONSE UNITS
# ============================================================


@router.get("/response-units/available")
def get_available_response_units(

    db: Session = Depends(get_db)

):

    units = (

        db.query(ResponseUnit)

        .filter(

            ResponseUnit.status
            == "AVAILABLE"

        )

        .order_by(
            ResponseUnit.id.desc()
        )

        .all()

    )

    return {

        "success": True,

        "count": len(units),

        "units": [

            serialize_unit(unit)

            for unit in units

        ],

    }


# ============================================================
# GET SINGLE RESPONSE UNIT
# ============================================================


@router.get("/response-units/{unit_id}")
def get_response_unit(

    unit_id: int,

    db: Session = Depends(get_db)

):

    unit = (

        db.query(ResponseUnit)

        .filter(
            ResponseUnit.id == unit_id
        )

        .first()

    )

    if unit is None:

        return {

            "success": False,

            "message":
                "Response unit not found",

        }

    return {

        "success": True,

        "unit":
            serialize_unit(unit),

    }


# ============================================================
# UPDATE RESPONSE UNIT STATUS
# ============================================================


@router.patch(
    "/response-units/{unit_id}/status"
)
def update_response_unit_status(

    unit_id: int,

    request: ResponseUnitStatusUpdate,

    db: Session = Depends(get_db)

):

    unit = (

        db.query(ResponseUnit)

        .filter(
            ResponseUnit.id == unit_id
        )

        .first()

    )

    if unit is None:

        return {

            "success": False,

            "message":
                "Response unit not found",

        }

    new_status = request.status.upper()

    allowed_statuses = {

        "AVAILABLE",

        "ASSIGNED",

        "IN_TRANSIT",

        "BUSY",

        "OFFLINE",

    }

    if new_status not in allowed_statuses:

        return {

            "success": False,

            "message":
                "Invalid response unit status",

            "allowed_statuses":
                sorted(allowed_statuses),

        }

    unit.status = new_status

    if new_status == "AVAILABLE":

        unit.assigned_sos_id = None

    db.commit()

    db.refresh(unit)

    return {

        "success": True,

        "message":
            "Response unit status updated successfully",

        "unit":
            serialize_unit(unit),

    }


# ============================================================
# ASSIGN RESPONSE UNIT TO SOS
# ============================================================


@router.patch(
    "/response-units/{unit_id}/assign"
)
def assign_response_unit(

    unit_id: int,

    request: ResponseUnitAssignment,

    db: Session = Depends(get_db)

):

    unit = (

        db.query(ResponseUnit)

        .filter(
            ResponseUnit.id == unit_id
        )

        .first()

    )

    if unit is None:

        return {

            "success": False,

            "message":
                "Response unit not found",

        }

    if unit.status != "AVAILABLE":

        return {

            "success": False,

            "message":
                "Response unit is not available",

        }

    unit.status = "ASSIGNED"

    unit.assigned_sos_id = request.sos_id

    db.commit()

    db.refresh(unit)

    return {

        "success": True,

        "message":
            "Response unit assigned successfully",

        "unit":
            serialize_unit(unit),

        "sos_id":
            request.sos_id,

    }


# ============================================================
# RELEASE RESPONSE UNIT
# ============================================================


@router.patch(
    "/response-units/{unit_id}/release"
)
def release_response_unit(

    unit_id: int,

    db: Session = Depends(get_db)

):

    unit = (

        db.query(ResponseUnit)

        .filter(
            ResponseUnit.id == unit_id
        )

        .first()

    )

    if unit is None:

        return {

            "success": False,

            "message":
                "Response unit not found",

        }

    unit.status = "AVAILABLE"

    unit.assigned_sos_id = None

    db.commit()

    db.refresh(unit)

    return {

        "success": True,

        "message":
            "Response unit released successfully",

        "unit":
            serialize_unit(unit),

    }


# ============================================================
# RESPONSE UNIT SUMMARY
# ============================================================


@router.get("/response-units/summary")
def response_units_summary(

    db: Session = Depends(get_db)

):

    units = (

        db.query(ResponseUnit)

        .all()

    )

    police = [

        unit

        for unit in units

        if unit.unit_type == "POLICE"

    ]

    ambulances = [

        unit

        for unit in units

        if unit.unit_type == "AMBULANCE"

    ]

    def count_status(items, status):

        return sum(

            1

            for item in items

            if item.status == status

        )

    return {

        "success": True,

        "total": len(units),

        "police": {

            "total":
                len(police),

            "available":
                count_status(
                    police,
                    "AVAILABLE"
                ),

            "assigned":
                count_status(
                    police,
                    "ASSIGNED"
                ),

            "busy":
                count_status(
                    police,
                    "BUSY"
                ),

        },

        "ambulance": {

            "total":
                len(ambulances),

            "available":
                count_status(
                    ambulances,
                    "AVAILABLE"
                ),

            "assigned":
                count_status(
                    ambulances,
                    "ASSIGNED"
                ),

            "busy":
                count_status(
                    ambulances,
                    "BUSY"
                ),

        },

    }