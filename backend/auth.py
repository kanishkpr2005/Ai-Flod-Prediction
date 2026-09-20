import hashlib
import os
import secrets
import sys
from datetime import datetime, timedelta

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")
        sys.stderr.reconfigure(encoding="utf-8", errors="backslashreplace")
    except Exception:
        pass

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

try:
    from .database import SessionLocal, init_db
    from .models import UserDB, PasswordResetCode
    from .email_service import send_reset_code_email
except ImportError:
    from database import SessionLocal, init_db
    from models import UserDB, PasswordResetCode
    from email_service import send_reset_code_email


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
    try:
        init_db()
    except Exception as init_err:
        print(f"⚠️ init_db failed in seed_default_authority_account: {init_err}")

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

    except Exception as err:
        print(f"⚠️ Authority account seeding failed: {err}")
    finally:
        db.close()


default_seed_setting = "0" if os.getenv("VERCEL") == "1" else "1"

if os.getenv("SEED_DEFAULT_AUTHORITY", default_seed_setting) == "1":
    try:
        seed_default_authority_account()
    except Exception as e:
        print(f"⚠️ Auto-seeding skipped during import: {e}")



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


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyResetCodeRequest(BaseModel):
    email: str
    code: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str


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
        .filter(func.lower(func.trim(UserDB.email)) == email)
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
        .filter(func.lower(func.trim(UserDB.email)) == email)
        .first()
    )

    if not user:
        return {
            "success": False,
            "message": "No account found with this email. Please check your email or sign up first.",
        }

    if user.role == "authority" and user.email.lower() != DEFAULT_AUTHORITY_EMAIL.lower():
        return {
            "success": False,
            "message": "Unauthorized authority account.",
        }

    password_hash = hash_password(credentials.password)
    password_hash_trimmed = hash_password(credentials.password.strip())

    if user.password_hash != password_hash and user.password_hash != password_hash_trimmed:
        return {
            "success": False,
            "message": "Incorrect password. Please verify your password or use 'Forgot password?' to reset it.",
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


# ============================================================
# FORGOT PASSWORD - REQUEST VERIFICATION CODE
# ============================================================

@router.post("/forgot-password")
def forgot_password(
    req: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    email = req.email.strip().lower()

    if not email:
        return {
            "success": False,
            "message": "Please enter your registered email address.",
        }

    user = (
        db.query(UserDB)
        .filter(func.lower(func.trim(UserDB.email)) == email)
        .first()
    )

    if not user:
        return {
            "success": False,
            "message": "No account found with this email. Please verify the spelling or create an account.",
        }

    # Generate 6-digit verification code
    code = f"{secrets.randbelow(900000) + 100000}"
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    # Invalidate previous unused codes for this email
    try:
        db.query(PasswordResetCode).filter(
            func.lower(func.trim(PasswordResetCode.email)) == email,
            PasswordResetCode.used == 0,
        ).update({"used": 2})
    except Exception as e:
        print(f"⚠️ Notice invalidating old reset codes: {e}")

    reset_entry = PasswordResetCode(
        email=email,
        code=code,
        expires_at=expires_at,
        used=0,
    )
    db.add(reset_entry)
    db.commit()

    # Send branded verification email
    email_result = send_reset_code_email(email, user.name, code)

    response_data = {
        "success": True,
        "message": f"Verification code sent to {email}. Please check your inbox and spam folder.",
        "email": email,
    }

    if email_result.get("simulated"):
        response_data["dev_code"] = code
        response_data["dev_notice"] = (
            "SMTP is not yet configured or failed to deliver. Code is provided for testing."
        )

    return response_data


# ============================================================
# VERIFY RESET CODE
# ============================================================

@router.post("/verify-reset-code")
def verify_reset_code(
    req: VerifyResetCodeRequest,
    db: Session = Depends(get_db),
):
    email = req.email.strip().lower()
    code = req.code.strip()

    if not email or not code:
        return {
            "success": False,
            "message": "Email and verification code are required.",
        }

    entry = (
        db.query(PasswordResetCode)
        .filter(
            func.lower(func.trim(PasswordResetCode.email)) == email,
            PasswordResetCode.code == code,
            PasswordResetCode.used == 0,
        )
        .order_by(PasswordResetCode.id.desc())
        .first()
    )

    if not entry:
        return {
            "success": False,
            "message": "Invalid verification code. Please check the code and try again.",
        }

    if datetime.utcnow() > entry.expires_at:
        return {
            "success": False,
            "message": "Verification code has expired. Please request a new one.",
        }

    return {
        "success": True,
        "message": "Verification code is valid.",
    }


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post("/reset-password")
def reset_password(
    req: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    email = req.email.strip().lower()
    code = req.code.strip()
    new_password = req.new_password.strip()

    if not email or not code or not new_password:
        return {
            "success": False,
            "message": "Email, verification code, and new password are required.",
        }

    if len(new_password) < 6:
        return {
            "success": False,
            "message": "New password must be at least 6 characters long.",
        }

    user = (
        db.query(UserDB)
        .filter(func.lower(func.trim(UserDB.email)) == email)
        .first()
    )

    if not user:
        return {
            "success": False,
            "message": "User account not found.",
        }

    entry = (
        db.query(PasswordResetCode)
        .filter(
            func.lower(func.trim(PasswordResetCode.email)) == email,
            PasswordResetCode.code == code,
            PasswordResetCode.used == 0,
        )
        .order_by(PasswordResetCode.id.desc())
        .first()
    )

    if not entry:
        return {
            "success": False,
            "message": "Invalid verification code. Please request a new code.",
        }

    if datetime.utcnow() > entry.expires_at:
        return {
            "success": False,
            "message": "Verification code has expired. Please request a new code.",
        }

    # Update password and mark code as used
    user.password_hash = hash_password(new_password)
    entry.used = 1
    db.commit()

    return {
        "success": True,
        "message": "Password updated successfully! You can now log in with your new password.",
    }