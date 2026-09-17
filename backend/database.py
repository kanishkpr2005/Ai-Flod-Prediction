import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# ============================================================
# DATABASE PATH
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATABASE_PATH = os.path.join(
    BASE_DIR,
    "disaster.db"
)

configured_database_url = os.getenv("DATABASE_URL")

if os.getenv("VERCEL") == "1" and not configured_database_url:
    raise RuntimeError(
        "DATABASE_URL must point to a hosted PostgreSQL database on Vercel."
    )

DATABASE_URL = configured_database_url or f"sqlite:///{DATABASE_PATH}"


# ============================================================
# DATABASE ENGINE
# ============================================================

engine_options = {}

if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {
        "check_same_thread": False
    }

engine = create_engine(
    DATABASE_URL,
    **engine_options,
)


if DATABASE_URL.startswith("sqlite"):
    with engine.begin() as connection:
        tables = {
            row[0]
            for row in connection.exec_driver_sql(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
        }
        if "users" in tables:
            user_columns = {
                row[1]
                for row in connection.exec_driver_sql(
                    "PRAGMA table_info(users)"
                )
            }
            if "area" not in user_columns:
                connection.exec_driver_sql(
                    "ALTER TABLE users ADD COLUMN area VARCHAR"
                )


# ============================================================
# SESSION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ============================================================
# BASE
# ============================================================

Base = declarative_base()


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()