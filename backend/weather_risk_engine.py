from typing import Dict


def calculate_flood_risk(
    rainfall_mm: float,
    rainfall_probability: float = 0.0,
    humidity: float = 0.0,
    temperature: float = 0.0,
    weather_code: int = 0,
    forecast_rainfall_mm: float = 0.0,
    maximum_hourly_rainfall_mm: float = 0.0,
) -> Dict:
    """
    Calculate flood risk using current weather
    and short-term rainfall forecast.
    """

    # ==================================================
    # NORMALIZE INPUTS
    # ==================================================

    rainfall_mm = max(
        0.0,
        float(rainfall_mm)
    )

    rainfall_probability = max(
        0.0,
        min(100.0, float(rainfall_probability))
    )

    humidity = max(
        0.0,
        min(100.0, float(humidity))
    )

    temperature = float(temperature)

    weather_code = int(weather_code)

    forecast_rainfall_mm = max(
        0.0,
        float(forecast_rainfall_mm)
    )

    maximum_hourly_rainfall_mm = max(
        0.0,
        float(maximum_hourly_rainfall_mm)
    )

    # ==================================================
    # INITIAL VALUES
    # ==================================================

    score = 0.0

    factors = []

    # ==================================================
    # 1. CURRENT RAINFALL
    # ==================================================

    if rainfall_mm >= 100:

        score += 45

        factors.append(
            "Extremely heavy current rainfall"
        )

    elif rainfall_mm >= 70:

        score += 40

        factors.append(
            "Very heavy current rainfall"
        )

    elif rainfall_mm >= 50:

        score += 35

        factors.append(
            "Heavy current rainfall"
        )

    elif rainfall_mm >= 30:

        score += 25

        factors.append(
            "Moderate to heavy current rainfall"
        )

    elif rainfall_mm >= 15:

        score += 15

        factors.append(
            "Moderate current rainfall"
        )

    elif rainfall_mm >= 5:

        score += 7

        factors.append(
            "Light current rainfall"
        )

    # ==================================================
    # 2. NEXT 6 HOURS RAINFALL
    # ==================================================

    if forecast_rainfall_mm >= 100:

        score += 35

        factors.append(
            "Extremely heavy rainfall forecast"
        )

    elif forecast_rainfall_mm >= 70:

        score += 30

        factors.append(
            "Very heavy rainfall forecast"
        )

    elif forecast_rainfall_mm >= 50:

        score += 25

        factors.append(
            "Heavy rainfall forecast"
        )

    elif forecast_rainfall_mm >= 30:

        score += 18

        factors.append(
            "Significant rainfall forecast"
        )

    elif forecast_rainfall_mm >= 15:

        score += 10

        factors.append(
            "Moderate rainfall forecast"
        )

    elif forecast_rainfall_mm >= 5:

        score += 5

        factors.append(
            "Rainfall expected in next few hours"
        )

    # ==================================================
    # 3. MAXIMUM HOURLY RAINFALL
    # ==================================================

    if maximum_hourly_rainfall_mm >= 50:

        score += 20

        factors.append(
            "Extremely intense hourly rainfall forecast"
        )

    elif maximum_hourly_rainfall_mm >= 30:

        score += 15

        factors.append(
            "Very intense hourly rainfall forecast"
        )

    elif maximum_hourly_rainfall_mm >= 20:

        score += 12

        factors.append(
            "Heavy hourly rainfall forecast"
        )

    elif maximum_hourly_rainfall_mm >= 10:

        score += 7

        factors.append(
            "Significant hourly rainfall forecast"
        )

    # ==================================================
    # 4. RAIN PROBABILITY
    # ==================================================

    if rainfall_probability >= 90:

        score += 10

        factors.append(
            "Very high probability of rain"
        )

    elif rainfall_probability >= 75:

        score += 8

        factors.append(
            "High probability of rain"
        )

    elif rainfall_probability >= 50:

        score += 5

        factors.append(
            "Moderate probability of rain"
        )

    elif rainfall_probability >= 30:

        score += 2

        factors.append(
            "Rain possible"
        )

    # ==================================================
    # 5. HUMIDITY
    # ==================================================

    if humidity >= 90:

        score += 8

        factors.append(
            "Extremely high humidity"
        )

    elif humidity >= 80:

        score += 5

        factors.append(
            "High humidity"
        )

    elif humidity >= 70:

        score += 3

        factors.append(
            "Elevated humidity"
        )

    # ==================================================
    # 6. WEATHER CONDITION
    # ==================================================

    # WMO weather codes:
    #
    # 51-57 = Drizzle
    # 61-67 = Rain
    # 80-82 = Rain showers
    # 95-99 = Thunderstorm

    if 61 <= weather_code <= 67:

        score += 7

        factors.append(
            "Rain detected"
        )

    elif 80 <= weather_code <= 82:

        score += 9

        factors.append(
            "Rain showers detected"
        )

    elif 95 <= weather_code <= 99:

        score += 12

        factors.append(
            "Thunderstorm detected"
        )

    elif 51 <= weather_code <= 57:

        score += 4

        factors.append(
            "Drizzle detected"
        )

    # ==================================================
    # 7. TEMPERATURE
    # ==================================================

    if temperature >= 40:

        score += 2

        factors.append(
            "Very high temperature"
        )

    # ==================================================
    # LIMIT SCORE
    # ==================================================

    score = min(
        100,
        round(score)
    )

    # ==================================================
    # DETERMINE RISK LEVEL
    # ==================================================

    if score >= 75:

        risk_level = "CRITICAL"

    elif score >= 50:

        risk_level = "HIGH"

    elif score >= 25:

        risk_level = "MODERATE"

    else:

        risk_level = "LOW"

    # ==================================================
    # RECOMMENDATIONS
    # ==================================================

    recommendations = {

        "LOW":
            "No immediate flood action required. "
            "Continue monitoring weather.",

        "MODERATE":
            "Monitor rainfall and weather conditions "
            "closely. Prepare for possible localized flooding.",

        "HIGH":
            "Issue an early warning and prepare "
            "emergency response resources.",

        "CRITICAL":
            "Issue an immediate flood alert and "
            "activate emergency preparedness."
    }

    recommendation = recommendations[
        risk_level
    ]

    # ==================================================
    # RETURN RESULT
    # ==================================================

    return {

        "risk_score": score,

        "risk_level": risk_level,

        "factors": factors,

        "recommendation": recommendation,

        "weather": {

            "rainfall_mm":
                rainfall_mm,

            "rainfall_probability":
                rainfall_probability,

            "humidity":
                humidity,

            "temperature":
                temperature,

            "weather_code":
                weather_code,

            "forecast_rainfall_mm":
                forecast_rainfall_mm,

            "maximum_hourly_rainfall_mm":
                maximum_hourly_rainfall_mm,
        }
    }