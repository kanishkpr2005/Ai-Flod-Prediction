from contextlib import asynccontextmanager

import os
import pickle
from datetime import datetime

import pandas as pd

from pydantic import BaseModel
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

try:
    from .database import engine, get_db
    from .models import Base, Disaster, Notification
    from .auth import router as auth_router
    from .reports import router as reports_router
    from .dashboard import router as dashboard_router
    from .location import router as location_router
    from .rescue import router as rescue_router
    from .volunteers import router as volunteers_router
    from .alerts import router as alerts_router
    from .sos import router as sos_router
    from .response_teams import router as response_teams_router
    from .response_units import router as response_units_router
    from .gis import router as gis_router
    from .monitor_runner import start_background_monitor
except ImportError:
    from database import engine, get_db
    from models import Base, Disaster, Notification
    from auth import router as auth_router
    from reports import router as reports_router
    from dashboard import router as dashboard_router
    from location import router as location_router
    from rescue import router as rescue_router
    from volunteers import router as volunteers_router
    from alerts import router as alerts_router
    from sos import router as sos_router
    from response_teams import router as response_teams_router
    from response_units import router as response_units_router
    from gis import router as gis_router
    from monitor_runner import start_background_monitor


# ============================================================
# PATHS
# ============================================================

BACKEND_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

BASE_DIR = os.path.dirname(
    BACKEND_DIR
)

LIVE_PREDICTIONS_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "live_weather_predictions.csv",
)

MODEL_FILE = os.path.join(
    BACKEND_DIR,
    "disaster_model.pkl",
)


# ============================================================
# LOAD TEXT ML MODEL
# ============================================================

vectorizer = None
model = None

try:
    if os.path.exists(MODEL_FILE):

        with open(MODEL_FILE, "rb") as f:
            vectorizer, model = pickle.load(f)

        print("✅ Disaster text ML model loaded")

    else:
        print("⚠️ disaster_model.pkl not found")

except Exception as error:

    print(
        f"⚠️ ML model loading failed: {error}"
    )


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(
    bind=engine
)

with engine.begin() as connection:
    user_columns = {
        row[1]
        for row in connection.execute(text("PRAGMA table_info(users)"))
    }
    if "area" not in user_columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN area VARCHAR"))


# ============================================================
# LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    print()
    print("=" * 60)
    print("      AI DISASTER RESPONSE PLATFORM")
    print("=" * 60)

    try:

        print(
            "🚀 Starting automatic weather monitoring..."
        )

        start_background_monitor()

        print(
            "✅ Automatic monitoring started"
        )

        print(
            "⏱️ Monitoring interval: 30 minutes"
        )

    except Exception as error:

        print(
            f"⚠️ Monitor startup failed: {error}"
        )

    print("=" * 60)
    print()

    yield

    print()
    print(
        "🛑 FastAPI application shutting down"
    )
    print()


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="AI Disaster Response Platform",
    description=(
        "AI-powered disaster prediction, GIS, "
        "automatic alerts and emergency response platform."
    ),
    version="3.0.0",
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

# AUTHENTICATION
# Frontend uses:
# http://127.0.0.1:8000/auth/login
# http://127.0.0.1:8000/auth/register

app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"],
)


# OTHER ROUTERS

app.include_router(
    reports_router,
)

app.include_router(
    dashboard_router,
)

app.include_router(
    location_router,
)

app.include_router(
    rescue_router,
)

app.include_router(
    volunteers_router,
)

app.include_router(
    alerts_router,
)


@app.get("/notifications")
def get_notifications(
    user_id: int | None = None,
    role: str = "user",
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(
        Notification.expires_at > datetime.utcnow()
    )
    if role.lower() == "authority":
        query = query.filter(Notification.recipient_role == "authority")
    elif user_id is not None:
        query = query.filter(Notification.recipient_user_id == user_id)
    else:
        return {"notifications": [], "unread": 0}

    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    return {
        "notifications": [
            {
                "id": item.id,
                "title": item.title,
                "message": item.message,
                "area": item.area,
                "severity": item.severity,
                "read": bool(item.read),
                "created_at": item.created_at,
            }
            for item in notifications
        ],
        "unread": sum(1 for item in notifications if not item.read),
    }


@app.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()
    if not notification:
        return {"success": False, "message": "Notification not found"}
    notification.read = 1
    db.commit()
    return {"success": True}


@app.get("/disasters")
def get_disasters(db: Session = Depends(get_db)):
    disasters = db.query(Disaster).order_by(Disaster.created_at.desc()).all()
    return {
        "disasters": [
            {
                "id": disaster.id,
                "disaster_type": disaster.disaster_type,
                "location": disaster.location,
                "severity": disaster.severity,
                "latitude": disaster.latitude,
                "longitude": disaster.longitude,
                "description": disaster.description,
                "created_at": disaster.created_at,
            }
            for disaster in disasters
        ]
    }

app.include_router(
    sos_router,
)

app.include_router(
    response_units_router,
)

app.include_router(
    gis_router,
)

app.include_router(
    response_teams_router,
)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": (
            "AI Disaster Response Platform Backend is Running"
        ),
        "status": "success",
        "automatic_monitoring": True,
        "monitoring_interval_minutes": 30,
        "gis": True,
        "sos": True,
        "live_prediction_api": True,
        "authentication": True,
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "automatic_monitoring": True,
        "monitoring_interval_minutes": 30,
        "gis": True,
        "sos": True,
        "live_prediction_file": os.path.exists(
            LIVE_PREDICTIONS_FILE
        ),
        "ml_model": model is not None,
        "authentication": True,
    }


# ============================================================
# CREATE DISASTER
# ============================================================

class DisasterCreate(BaseModel):

    disaster_type: str
    location: str
    severity: str

    latitude: float | None = None
    longitude: float | None = None

    description: str | None = None


@app.post("/disasters")
def create_disaster(
    request: DisasterCreate,
    db: Session = Depends(get_db),
):

    disaster = Disaster(
        disaster_type=request.disaster_type,
        location=request.location,
        severity=request.severity,
        latitude=request.latitude,
        longitude=request.longitude,
        description=request.description,
    )

    db.add(disaster)
    db.commit()
    db.refresh(disaster)

    return {
        "success": True,
        "message": "Disaster added successfully",
        "disaster": {
            "id": disaster.id,
            "disaster_type": disaster.disaster_type,
            "location": disaster.location,
            "severity": disaster.severity,
            "latitude": disaster.latitude,
            "longitude": disaster.longitude,
            "description": disaster.description,
        },
    }


# ============================================================
# GET DISASTERS
# ============================================================

@app.get("/disasters")
def get_disasters(
    db: Session = Depends(get_db),
):

    disasters = (
        db.query(Disaster)
        .order_by(Disaster.id.desc())
        .all()
    )

    return {
        "total": len(disasters),
        "disasters": [
            {
                "id": d.id,
                "disaster_type": d.disaster_type,
                "location": d.location,
                "severity": d.severity,
                "latitude": d.latitude,
                "longitude": d.longitude,
                "description": d.description,
            }
            for d in disasters
        ],
    }


# ============================================================
# TEXT DISASTER PREDICTION
# ============================================================

class DisasterRequest(BaseModel):

    text: str


@app.post("/predict")
def predict_disaster(
    request: DisasterRequest,
):

    if vectorizer is None or model is None:

        return {
            "success": False,
            "message": "Text ML model is not loaded",
        }

    try:

        X = vectorizer.transform(
            [request.text]
        )

        prediction = model.predict(X)

        disaster = str(
            prediction[0]
        )

        disaster_lower = disaster.lower()

        if disaster_lower in [
            "earthquake",
            "flood",
            "cyclone",
        ]:

            risk = "HIGH"

        elif disaster_lower in [
            "fire",
            "landslide",
        ]:

            risk = "MEDIUM"

        else:

            risk = "LOW"

        return {
            "success": True,
            "input": request.text,
            "predicted_disaster": disaster,
            "risk_level": risk,
        }

    except Exception as error:

        return {
            "success": False,
            "message": str(error),
        }


# ============================================================
# LIVE PREDICTIONS LOADER
# ============================================================

def load_live_predictions():

    if not os.path.exists(
        LIVE_PREDICTIONS_FILE
    ):

        return None

    try:

        return pd.read_csv(
            LIVE_PREDICTIONS_FILE
        )

    except Exception as error:

        print(
            f"Live prediction read error: {error}"
        )

        return None


# ============================================================
# NORMALIZE LIVE PREDICTION DATA
# ============================================================

def normalize_prediction_dataframe(df):

    if df is None:
        return None

    df = df.copy()

    numeric_columns = [
        "latitude",
        "longitude",
        "rainfall_ml_probability",
        "weather_probability",
        "final_flood_probability",
    ]

    for column in numeric_columns:

        if column in df.columns:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce",
            )

    if "weather_data_available" in df.columns:

        df["weather_data_available"] = (
            df["weather_data_available"]
            .fillna(False)
            .astype(bool)
        )

    df = df.where(
        pd.notnull(df),
        None,
    )

    return df


# ============================================================
# LIVE PREDICTIONS
# ============================================================

@app.get("/live-predictions")
def get_live_predictions():

    df = load_live_predictions()

    if df is None:

        return {
            "status": "error",
            "message": (
                "Live prediction file not available"
            ),
            "total_districts": 0,
            "data": [],
        }

    try:

        df = normalize_prediction_dataframe(df)

        records = df.to_dict(
            orient="records"
        )

        return {
            "status": "success",
            "total_districts": len(records),
            "data": records,
        }

    except Exception as error:

        return {
            "status": "error",
            "message": str(error),
            "total_districts": 0,
            "data": [],
        }


# ============================================================
# FILTER PREDICTIONS
# ============================================================

def get_predictions_by_risk(
    requested_risk: str,
):

    df = load_live_predictions()

    if df is None:

        return {
            "status": "error",
            "message": (
                "Live prediction file not available"
            ),
            "data": [],
        }

    try:

        df = normalize_prediction_dataframe(df)

        if "risk_level" not in df.columns:

            return {
                "status": "error",
                "message": (
                    "risk_level column missing"
                ),
                "data": [],
            }

        filtered = df[
            df["risk_level"]
            .astype(str)
            .str.upper()
            == requested_risk.upper()
        ]

        records = filtered.to_dict(
            orient="records"
        )

        return {
            "status": "success",
            "risk_level": requested_risk.upper(),
            "total": len(records),
            "data": records,
        }

    except Exception as error:

        return {
            "status": "error",
            "message": str(error),
            "data": [],
        }


# ============================================================
# RISK ENDPOINTS
# ============================================================

@app.get("/live-predictions/high")
def high_predictions():

    return get_predictions_by_risk(
        "HIGH"
    )


@app.get("/live-predictions/medium")
def medium_predictions():

    return get_predictions_by_risk(
        "MEDIUM"
    )


@app.get("/live-predictions/low")
def low_predictions():

    return get_predictions_by_risk(
        "LOW"
    )


@app.get("/live-predictions/critical")
def critical_predictions():

    return get_predictions_by_risk(
        "CRITICAL"
    )


# ============================================================
# LIVE PREDICTION SUMMARY
# ============================================================

@app.get("/live-predictions/summary")
def live_prediction_summary():

    df = load_live_predictions()

    if df is None:

        return {
            "status": "error",
            "message": (
                "Live prediction file not available"
            ),
        }

    try:

        df = normalize_prediction_dataframe(df)

        risk_counts = {}

        if "risk_level" in df.columns:

            risk_counts = (
                df["risk_level"]
                .astype(str)
                .str.upper()
                .value_counts()
                .to_dict()
            )

        weather_available = 0

        if "weather_data_available" in df.columns:

            weather_available = int(
                df[
                    "weather_data_available"
                ].sum()
            )

        total = len(df)

        return {
            "status": "success",

            "total_districts": total,

            "critical_risk":
                risk_counts.get(
                    "CRITICAL",
                    0,
                ),

            "high_risk":
                risk_counts.get(
                    "HIGH",
                    0,
                ),

            "medium_risk":
                risk_counts.get(
                    "MEDIUM",
                    0,
                ),

            "low_risk":
                risk_counts.get(
                    "LOW",
                    0,
                ),

            "weather_available":
                weather_available,

            "weather_unavailable":
                total - weather_available,
        }

    except Exception as error:

        return {
            "status": "error",
            "message": str(error),
        }


# ============================================================
# SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )