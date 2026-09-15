import csv
import os

import requests

from fastapi import APIRouter

try:
    from .models import Alert
    from .database import SessionLocal
except ImportError:
    from models import Alert
    from database import SessionLocal


router = APIRouter(prefix="/gis", tags=["GIS"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREDICTIONS_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "live_weather_predictions.csv",
)

WEATHER_API = "https://api.open-meteo.com/v1/forecast"
FLOOD_API = "https://flood-api.open-meteo.com/v1/flood"
ELEVATION_API = "https://api.open-meteo.com/v1/elevation"


def number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def district_prediction_rows():
    if not os.path.exists(PREDICTIONS_FILE):
        return []

    with open(PREDICTIONS_FILE, newline="", encoding="utf-8") as file:
        rows = []
        for row in csv.DictReader(file):
            latitude = number(row.get("latitude"))
            longitude = number(row.get("longitude"))
            if latitude is None or longitude is None:
                continue

            probability = number(row.get("final_flood_probability")) or 0
            rows.append({
                "id": f"district-{row.get('state', '')}-{row.get('district', '')}",
                "type": "district-risk",
                "state": row.get("state"),
                "district": row.get("district"),
                "latitude": latitude,
                "longitude": longitude,
                "severity": (row.get("risk_level") or "LOW").upper(),
                "probability": round(probability * 100, 1),
                "rainfall_probability": round((number(row.get("rainfall_ml_probability")) or 0) * 100, 1),
                "weather_probability": round((number(row.get("weather_probability")) or 0) * 100, 1),
                "weather_data_available": row.get("weather_data_available") == "True",
                "title": f"{row.get('district')} district risk",
                "location": f"{row.get('district')}, {row.get('state')}",
            })
        return rows


@router.get("/environment")
def environment_data(latitude: float, longitude: float):
    weather_data = {}
    flood_data = {}
    elevation_data = {}

    try:
        weather = requests.get(
            WEATHER_API,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current": "temperature_2m,precipitation,rain,wind_speed_10m",
                "daily": "precipitation_sum,rain_sum",
                "forecast_days": 3,
                "timezone": "auto",
            },
            timeout=15,
        )
        weather.raise_for_status()
        weather_data = weather.json()
    except requests.RequestException:
        pass

    try:
        flood = requests.get(
            FLOOD_API,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "daily": "river_discharge",
                "forecast_days": 3,
                "timezone": "auto",
            },
            timeout=15,
        )
        flood.raise_for_status()
        flood_data = flood.json()
    except requests.RequestException:
        pass

    try:
        elevation = requests.get(
            ELEVATION_API,
            params={"latitude": latitude, "longitude": longitude},
            timeout=15,
        )
        elevation.raise_for_status()
        elevation_data = elevation.json()
    except requests.RequestException:
        pass

    current = weather_data.get("current", {})
    daily = weather_data.get("daily", {})
    discharge = flood_data.get("daily", {}).get("river_discharge", [])

    return {
        "source": "Open-Meteo weather, flood and elevation APIs",
        "latitude": latitude,
        "longitude": longitude,
        "temperature_c": current.get("temperature_2m"),
        "current_precipitation_mm": current.get("precipitation"),
        "current_rain_mm": current.get("rain"),
        "wind_speed_kmh": current.get("wind_speed_10m"),
        "rainfall_forecast_mm": daily.get("precipitation_sum", []),
        "river_discharge_m3s": discharge,
        "elevation_m": (elevation_data.get("elevation") or [None])[0],
        "updated_at": current.get("time"),
    }


@router.get("/district-alerts")
def district_alerts():
    db = SessionLocal()
    try:
        database_alerts = db.query(Alert).filter(
            Alert.status.ilike("ACTIVE")
        ).all()
        alerts = [
            {
                "id": f"alert-{alert.id}",
                "type": "alert",
                "latitude": alert.latitude,
                "longitude": alert.longitude,
                "severity": (alert.severity or "LOW").upper(),
                "title": alert.title,
                "location": alert.location,
                "message": alert.message,
                "disaster_type": alert.disaster_type,
            }
            for alert in database_alerts
            if alert.latitude is not None and alert.longitude is not None
        ]
        return {
            "total": len(alerts),
            "district_predictions": district_prediction_rows(),
            "alerts": alerts,
        }
    finally:
        db.close()
