from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import hashlib

try:
    from .database import SessionLocal
    from .models import UserDB
except ImportError:
    from database import SessionLocal
    from models import UserDB


router = APIRouter()

DEFAULT_AUTHORITY_EMAIL = "kanishkpratapsingh1705@gmail.com"
DEFAULT_AUTHORITY_PASSWORD = "kanishk.2005"


# ============================================================
# DATABASE
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# PASSWORD HASH
# ============================================================

def hash_password(password: str) -> str:
    return hashlib.sha256(
        password.encode("utf-8")
    ).hexdigest()


# ============================================================
# AUTHORITY SEED
# ============================================================

def seed_default_authority_account():
    db = SessionLocal()

    try:
        email = DEFAULT_AUTHORITY_EMAIL.lower().strip()
        password_hash = hash_password(DEFAULT_AUTHORITY_PASSWORD)

        user = (
            db.query(UserDB)
            .filter(UserDB.email == email)
            .first()
        )

        if user:
            user.name = user.name or "Authority Administrator"
            user.role = "authority"
            user.password_hash = password_hash
            db.commit()
            print(f"✅ Authority account ready: {email}")
            return

        new_user = UserDB(
            name="Authority Administrator",
            email=email,
            password_hash=password_hash,
            role="authority",
        )

        db.add(new_user)
        db.commit()
        print(f"✅ Default authority account created: {email}")

    finally:
        db.close()


seed_default_authority_account()


# ============================================================
# SCHEMAS
# ============================================================

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "user"
    area: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


# ============================================================
# REGISTER
# ============================================================

@router.post("/register")
def register_user(
    user: RegisterRequest,
    db: Session = Depends(get_db),
):
    email = user.email.strip().lower()
    role = (user.role or "user").lower().strip()

    if role not in ["user", "authority"]:
        return {
            "success": False,
            "message": "Invalid role selected.",
        }

    if role == "authority":
        if email != DEFAULT_AUTHORITY_EMAIL.lower():
            return {
                "success": False,
                "message": "Only the approved authority email can register as an authority.",
            }
    elif email == DEFAULT_AUTHORITY_EMAIL.lower():
        return {
            "success": False,
            "message": "This email is reserved for authority account access.",
        }

    existing_user = (
        db.query(UserDB)
        .filter(UserDB.email == email)
        .first()
    )

    if existing_user:
        return {
            "success": False,
            "message": "Email already registered",
        }

    new_user = UserDB(
        name=user.name.strip(),
        email=email,
        password_hash=hash_password(user.password),
        role=role,
            area=(user.area or "").strip() or None,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "area": new_user.area,
        },
    }


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login_user(
    credentials: LoginRequest,
    db: Session = Depends(get_db),
):

    email = credentials.email.strip().lower()

    user = (
        db.query(UserDB)
        .filter(UserDB.email == email)
        .first()
    )

    if not user:
        return {
            "success": False,
            "message": "Invalid email or password",
        }

    if user.role == "authority" and user.email.lower() != DEFAULT_AUTHORITY_EMAIL.lower():
        return {
            "success": False,
            "message": "Unauthorized authority account.",
        }

    password_hash = hash_password(
        credentials.password
    )

    if user.password_hash != password_hash:
        return {
            "success": False,
            "message": "Invalid email or password",
        }

    return {
        "success": True,
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.upper(),
            "area": user.area,
        },
    }