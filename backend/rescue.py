from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

try:
    from .database import get_db
    from .models import RescueTeam
except ImportError:
    from database import get_db
    from models import RescueTeam


router = APIRouter()


# ============================================================
# REQUEST MODEL
# ============================================================

class RescueTeamCreate(BaseModel):

    name: str = Field(
        min_length=1
    )

    contact: str | None = None

    location: str | None = None

    specialization: str | None = None

    members: int = Field(
        default=1,
        ge=1
    )

    status: str = "available"


# ============================================================
# CREATE RESCUE TEAM
# ============================================================

@router.post("/rescue-teams")
def create_rescue_team(
    team: RescueTeamCreate,
    db: Session = Depends(get_db)
):

    new_team = RescueTeam(

        name=team.name,

        contact=team.contact,

        location=team.location,

        specialization=team.specialization,

        members=team.members,

        status=team.status
    )

    db.add(new_team)

    db.commit()

    db.refresh(new_team)

    return {

        "message":
            "Rescue team registered successfully",

        "rescue_team": {

            "id":
                new_team.id,

            "name":
                new_team.name,

            "contact":
                new_team.contact,

            "location":
                new_team.location,

            "specialization":
                new_team.specialization,

            "members":
                new_team.members,

            "status":
                new_team.status
        }
    }


# ============================================================
# GET ALL RESCUE TEAMS
# ============================================================

@router.get("/rescue-teams")
def get_rescue_teams(
    db: Session = Depends(get_db)
):

    teams = (
        db.query(RescueTeam)
        .order_by(
            RescueTeam.id.desc()
        )
        .all()
    )

    result = []

    for team in teams:

        result.append({

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

    return {

        "total_teams":
            len(result),

        "rescue_teams":
            result
    }


# ============================================================
# GET SINGLE RESCUE TEAM
# ============================================================

@router.get("/rescue-teams/{team_id}")
def get_single_rescue_team(
    team_id: int,
    db: Session = Depends(get_db)
):

    team = (
        db.query(RescueTeam)
        .filter(
            RescueTeam.id == team_id
        )
        .first()
    )

    if not team:

        raise HTTPException(
            status_code=404,
            detail="Rescue team not found"
        )

    return {

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
    }


# ============================================================
# UPDATE RESCUE TEAM
# ============================================================

@router.put("/rescue-teams/{team_id}")
def update_rescue_team(
    team_id: int,
    team: RescueTeamCreate,
    db: Session = Depends(get_db)
):

    existing = (
        db.query(RescueTeam)
        .filter(
            RescueTeam.id == team_id
        )
        .first()
    )

    if not existing:

        raise HTTPException(
            status_code=404,
            detail="Rescue team not found"
        )

    existing.name = team.name

    existing.contact = team.contact

    existing.location = team.location

    existing.specialization = (
        team.specialization
    )

    existing.members = team.members

    existing.status = team.status

    db.commit()

    db.refresh(existing)

    return {

        "message":
            "Rescue team updated successfully",

        "rescue_team": {

            "id":
                existing.id,

            "name":
                existing.name,

            "contact":
                existing.contact,

            "location":
                existing.location,

            "specialization":
                existing.specialization,

            "members":
                existing.members,

            "status":
                existing.status
        }
    }


# ============================================================
# DELETE RESCUE TEAM
# ============================================================

@router.delete("/rescue-teams/{team_id}")
def delete_rescue_team(
    team_id: int,
    db: Session = Depends(get_db)
):

    existing = (
        db.query(RescueTeam)
        .filter(
            RescueTeam.id == team_id
        )
        .first()
    )

    if not existing:

        raise HTTPException(
            status_code=404,
            detail="Rescue team not found"
        )

    db.delete(existing)

    db.commit()

    return {

        "message":
            "Rescue team deleted successfully",

        "team_id":
            team_id
    }