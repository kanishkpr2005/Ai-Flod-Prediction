from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel

try:
    from .database import SessionLocal
    from .models import ResponseTeam
except ImportError:
    from database import SessionLocal
    from models import ResponseTeam


router = APIRouter(
    prefix="/response-teams",
    tags=["Response Teams"]
)


# ============================================================
# REQUEST SCHEMAS
# ============================================================


class ResponseTeamCreate(BaseModel):

    name: str

    team_type: str

    contact: str | None = None

    location: str | None = None

    latitude: float | None = None

    longitude: float | None = None

    members: int = 1

    vehicle_number: str | None = None

    specialization: str | None = None

    status: str = "AVAILABLE"


class ResponseTeamStatusUpdate(BaseModel):

    status: str


class ResponseTeamAssignment(BaseModel):

    sos_id: int


# ============================================================
# SERIALIZER
# ============================================================


def serialize_team(team):

    return {

        "id": team.id,

        "name": team.name,

        "team_type": team.team_type,

        "contact": team.contact,

        "location": team.location,

        "latitude": team.latitude,

        "longitude": team.longitude,

        "members": team.members,

        "vehicle_number": team.vehicle_number,

        "specialization": team.specialization,

        "status": team.status,

        "created_at": (
            team.created_at.isoformat()
            if team.created_at
            else None
        ),
    }


# ============================================================
# CREATE RESPONSE TEAM
# ============================================================


@router.post("")
def create_response_team(
    request: ResponseTeamCreate
):

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # VALIDATE TEAM TYPE
        # ----------------------------------------------------

        allowed_types = {
            "POLICE",
            "AMBULANCE",
            "RESCUE",
        }

        team_type = request.team_type.upper()

        if team_type not in allowed_types:

            return {

                "success": False,

                "message":
                    "Invalid response team type",

                "allowed_types":
                    sorted(allowed_types),

            }

        # ----------------------------------------------------
        # VALIDATE STATUS
        # ----------------------------------------------------

        allowed_statuses = {
            "AVAILABLE",
            "ASSIGNED",
            "BUSY",
            "IN_TRANSIT",
            "OFFLINE",
        }

        status = request.status.upper()

        if status not in allowed_statuses:

            return {

                "success": False,

                "message":
                    "Invalid response team status",

                "allowed_statuses":
                    sorted(allowed_statuses),

            }

        # ----------------------------------------------------
        # VALIDATE MEMBERS
        # ----------------------------------------------------

        if request.members < 1:

            return {

                "success": False,

                "message":
                    "Team must have at least one member",

            }

        # ----------------------------------------------------
        # CREATE TEAM
        # ----------------------------------------------------

        team = ResponseTeam(

            name=request.name,

            team_type=team_type,

            contact=request.contact,

            location=request.location,

            latitude=request.latitude,

            longitude=request.longitude,

            members=request.members,

            vehicle_number=request.vehicle_number,

            specialization=request.specialization,

            status=status,

            created_at=datetime.utcnow(),
        )

        db.add(team)

        db.commit()

        db.refresh(team)

        return {

            "success": True,

            "message":
                "Response team created successfully",

            "team":
                serialize_team(team),

        }

    except Exception as error:

        db.rollback()

        print(
            "Response team creation error:",
            error
        )

        return {

            "success": False,

            "message":
                "Unable to create response team",

        }

    finally:

        db.close()


# ============================================================
# GET ALL RESPONSE TEAMS
# ============================================================


@router.get("")
def get_response_teams():

    db = SessionLocal()

    try:

        teams = (

            db.query(ResponseTeam)

            .order_by(
                ResponseTeam.id.desc()
            )

            .all()

        )

        return {

            "success": True,

            "count": len(teams),

            "teams": [

                serialize_team(team)

                for team in teams

            ],

            "response_teams": [

                serialize_team(team)

                for team in teams

            ],

        }

    finally:

        db.close()


# ============================================================
# GET AVAILABLE TEAMS
# ============================================================


@router.get("/available")
def get_available_teams():

    db = SessionLocal()

    try:

        teams = (

            db.query(ResponseTeam)

            .filter(
                ResponseTeam.status == "AVAILABLE"
            )

            .order_by(
                ResponseTeam.id.desc()
            )

            .all()

        )

        return {

            "success": True,

            "count": len(teams),

            "teams": [

                serialize_team(team)

                for team in teams

            ],

        }

    finally:

        db.close()


# ============================================================
# GET TEAMS BY TYPE
# ============================================================


@router.get("/type/{team_type}")
def get_teams_by_type(
    team_type: str
):

    db = SessionLocal()

    try:

        team_type = team_type.upper()

        allowed_types = {
            "POLICE",
            "AMBULANCE",
            "RESCUE",
        }

        if team_type not in allowed_types:

            return {

                "success": False,

                "message":
                    "Invalid response team type",

                "allowed_types":
                    sorted(allowed_types),

            }

        teams = (

            db.query(ResponseTeam)

            .filter(
                ResponseTeam.team_type == team_type
            )

            .order_by(
                ResponseTeam.id.desc()
            )

            .all()

        )

        return {

            "success": True,

            "team_type": team_type,

            "count": len(teams),

            "teams": [

                serialize_team(team)

                for team in teams

            ],

        }

    finally:

        db.close()


# ============================================================
# GET SINGLE RESPONSE TEAM
# ============================================================


@router.get("/{team_id}")
def get_response_team(
    team_id: int
):

    db = SessionLocal()

    try:

        team = (

            db.query(ResponseTeam)

            .filter(
                ResponseTeam.id == team_id
            )

            .first()

        )

        if team is None:

            return {

                "success": False,

                "message":
                    "Response team not found",

            }

        return {

            "success": True,

            "team":
                serialize_team(team),

        }

    finally:

        db.close()


# ============================================================
# UPDATE TEAM STATUS
# ============================================================


@router.patch("/{team_id}/status")
def update_team_status(

    team_id: int,

    request: ResponseTeamStatusUpdate

):

    db = SessionLocal()

    try:

        team = (

            db.query(ResponseTeam)

            .filter(
                ResponseTeam.id == team_id
            )

            .first()

        )

        if team is None:

            return {

                "success": False,

                "message":
                    "Response team not found",

            }

        allowed_statuses = {

            "AVAILABLE",

            "ASSIGNED",

            "BUSY",

            "IN_TRANSIT",

            "OFFLINE",

        }

        new_status = request.status.upper()

        if new_status not in allowed_statuses:

            return {

                "success": False,

                "message":
                    "Invalid response team status",

                "allowed_statuses":
                    sorted(allowed_statuses),

            }

        team.status = new_status

        db.commit()

        db.refresh(team)

        return {

            "success": True,

            "message":
                "Response team status updated successfully",

            "team":
                serialize_team(team),

        }

    except Exception as error:

        db.rollback()

        print(
            "Response team status error:",
            error
        )

        return {
            "success": False,
            "message": "Unable to update team status",
        }

    finally:

        db.close()


# ============================================================
# ASSIGN RESPONSE TEAM TO SOS
# ============================================================

@router.patch("/{team_id}/assign")
def assign_response_team(

    team_id: int,

    request: ResponseTeamAssignment,

):

    db = SessionLocal()

    try:

        team = (

            db.query(ResponseTeam)

            .filter(
                ResponseTeam.id == team_id
            )

            .first()
        )

        if team is None:

            return {

                "success": False,

                "message": "Response team not found",

            }

        if team.status != "AVAILABLE":

            return {

                "success": False,

                "message": "Response team is not available",

            }

        team.status = "ASSIGNED"
        team.assigned_sos_id = request.sos_id

        db.commit()
        db.refresh(team)

        return {

            "success": True,

            "message": "Response team assigned successfully",

            "team": serialize_team(team),

            "sos_id": request.sos_id,

        }

    finally:

        db.close()


# ============================================================
# DELETE RESPONSE TEAM
# ============================================================


@router.delete("/{team_id}")
def delete_response_team(
    team_id: int
):

    db = SessionLocal()

    try:

        team = (

            db.query(ResponseTeam)

            .filter(
                ResponseTeam.id == team_id
            )

            .first()

        )

        if team is None:

            return {

                "success": False,

                "message":
                    "Response team not found",

            }

        db.delete(team)

        db.commit()

        return {

            "success": True,

            "message":
                "Response team deleted successfully",

            "team_id":
                team_id,

        }

    except Exception as error:

        db.rollback()

        print(
            "Response team deletion error:",
            error
        )

        return {

            "success": False,

            "message":
                "Unable to delete response team",

        }

    finally:

        db.close()