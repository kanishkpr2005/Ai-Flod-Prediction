from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Float,
    Text,
)

try:
    from .database import Base
except ImportError:
    from database import Base


# ============================================================
# DISASTERS
# ============================================================

class Disaster(Base):
    __tablename__ = "disasters"

    id = Column(Integer, primary_key=True, index=True)

    disaster_type = Column(String, nullable=False)
    location = Column(String, nullable=False)
    severity = Column(String, nullable=False)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    description = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )


# ============================================================
# SOS REQUESTS
# ============================================================

class SOSRequest(Base):
    __tablename__ = "sos_requests"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    phone = Column(String, nullable=True)

    location = Column(String, nullable=False)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    emergency = Column(String, nullable=True)

    description = Column(Text, nullable=True)

    people = Column(Integer, default=1)

    priority = Column(
        String,
        default="HIGH",
        index=True,
    )

    status = Column(
        String,
        default="PENDING",
        index=True,
    )

    assigned_unit_id = Column(
        Integer,
        nullable=True,
    )

    assigned_team_id = Column(
        Integer,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )

    resolved_at = Column(
        DateTime,
        nullable=True,
    )


# ============================================================
# REPORTS
# ============================================================

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=True)
    location = Column(String, nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    disaster_type = Column(String, nullable=True)

    description = Column(Text, nullable=True)

    status = Column(
        String,
        default="PENDING",
        index=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


# ============================================================
# RESCUE TEAMS
# ============================================================

class RescueTeam(Base):
    __tablename__ = "rescue_teams"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=True)

    contact = Column(String, nullable=True)

    location = Column(String, nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    specialization = Column(String, nullable=True)

    members = Column(
        Integer,
        default=1,
    )

    status = Column(
        String,
        default="AVAILABLE",
        index=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


# ============================================================
# RESPONSE UNITS
# POLICE / AMBULANCE
# ============================================================

class ResponseUnit(Base):
    __tablename__ = "response_units"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String,
        nullable=False,
    )

    unit_type = Column(
        String,
        nullable=False,
        index=True,
    )

    contact = Column(String, nullable=True)

    location = Column(String, nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    status = Column(
        String,
        default="AVAILABLE",
        index=True,
    )

    vehicle_number = Column(String, nullable=True)

    capacity = Column(
        Integer,
        default=1,
    )

    assigned_sos_id = Column(
        Integer,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


# ============================================================
# RESPONSE TEAMS
# ============================================================

class ResponseTeam(Base):
    __tablename__ = "response_teams"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String,
        nullable=False,
    )

    team_type = Column(
        String,
        nullable=False,
        index=True,
    )

    contact = Column(String, nullable=True)

    location = Column(String, nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    members = Column(
        Integer,
        default=1,
    )

    vehicle_number = Column(String, nullable=True)

    status = Column(
        String,
        default="AVAILABLE",
        index=True,
    )

    specialization = Column(String, nullable=True)

    assigned_sos_id = Column(
        Integer,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


# ============================================================
# VOLUNTEERS
# ============================================================

class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String,
        nullable=False,
    )

    phone = Column(String, nullable=True)

    location = Column(String, nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    skills = Column(String, nullable=True)

    status = Column(
        String,
        default="AVAILABLE",
        index=True,
    )


# ============================================================
# ALERTS
# ============================================================

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)

    message = Column(Text, nullable=False)

    location = Column(String, nullable=False)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    severity = Column(
        String,
        nullable=False,
        index=True,
    )

    status = Column(
        String,
        default="ACTIVE",
        index=True,
    )

    disaster_type = Column(
        String,
        default="general",
        index=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )

    expires_at = Column(
        DateTime,
        nullable=True,
    )


# ============================================================
# USERS
# ============================================================

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    role = Column(
        String,
        default="user",
    )

    area = Column(
        String,
        nullable=True,
        index=True,
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_user_id = Column(Integer, nullable=True, index=True)
    recipient_role = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    area = Column(String, nullable=False, index=True)
    severity = Column(String, nullable=False, index=True)
    read = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime, nullable=True)