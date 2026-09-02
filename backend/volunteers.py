from fastapi import APIRouter
from pydantic import BaseModel

try:
    from .database import SessionLocal
    from .models import Volunteer
except ImportError:
    from database import SessionLocal
    from models import Volunteer

router = APIRouter()


class VolunteerRequest(BaseModel):
    name: str
    phone: str
    location: str
    skills: str
    status: str = "AVAILABLE"


@router.post("/volunteers")
def create_volunteer(volunteer: VolunteerRequest):

    db = SessionLocal()

    new_volunteer = Volunteer(
        name=volunteer.name,
        phone=volunteer.phone,
        location=volunteer.location,
        skills=volunteer.skills,
        status=volunteer.status.upper()
    )

    db.add(new_volunteer)
    db.commit()
    db.refresh(new_volunteer)

    result = {
        "id": new_volunteer.id,
        "name": new_volunteer.name,
        "phone": new_volunteer.phone,
        "location": new_volunteer.location,
        "skills": new_volunteer.skills,
        "status": new_volunteer.status,
    }

    db.close()

    return {
        "message": "Volunteer registered successfully",
        "volunteer": result
    }


@router.get("/volunteers")
def get_volunteers():

    db = SessionLocal()

    volunteers = db.query(Volunteer).all()

    result = []

    for volunteer in volunteers:
        result.append({
            "id": volunteer.id,
            "name": volunteer.name,
            "phone": volunteer.phone,
            "location": volunteer.location,
            "skills": volunteer.skills,
            "status": volunteer.status,
        })

    db.close()

    return {
        "total_volunteers": len(result),
        "volunteers": result
    }


@router.get("/volunteers/{volunteer_id}")
def get_single_volunteer(volunteer_id: int):

    db = SessionLocal()

    volunteer = db.query(Volunteer).filter(
        Volunteer.id == volunteer_id
    ).first()

    db.close()

    if volunteer is None:
        return {
            "message": "Volunteer not found"
        }

    return {
        "id": volunteer.id,
        "name": volunteer.name,
        "phone": volunteer.phone,
        "location": volunteer.location,
        "skills": volunteer.skills,
        "status": volunteer.status,
    }


@router.put("/volunteers/{volunteer_id}")
def update_volunteer(
    volunteer_id: int,
    volunteer: VolunteerRequest
):

    db = SessionLocal()

    existing = db.query(Volunteer).filter(
        Volunteer.id == volunteer_id
    ).first()

    if existing is None:
        db.close()
        return {
            "message": "Volunteer not found"
        }

    existing.name = volunteer.name
    existing.phone = volunteer.phone
    existing.location = volunteer.location
    existing.skills = volunteer.skills
    existing.status = volunteer.status.upper()

    db.commit()
    db.refresh(existing)

    result = {
        "id": existing.id,
        "name": existing.name,
        "phone": existing.phone,
        "location": existing.location,
        "skills": existing.skills,
        "status": existing.status,
    }

    db.close()

    return {
        "message": "Volunteer updated successfully",
        "volunteer": result
    }