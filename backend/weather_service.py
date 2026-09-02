import time
import requests

from weather_risk_engine import calculate_flood_risk


# ==================================================
# OPEN-METEO CONFIGURATION
# ==================================================

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

REQUEST_TIMEOUT = 10
MAX_RETRIES = 3


# ==================================================
# FETCH LIVE WEATHER + FORECAST
# ==================================================

def fetch_weather(latitude: float, longitude: float):

    params = {
        "latitude": latitude,
        "longitude": longitude,

        # ------------------------------------------
        # Current weather
        # ------------------------------------------

        "current": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "precipitation,"
            "rain,"
            "showers,"
            "weather_code"
        ),

        # ------------------------------------------
        # Hourly forecast
        # ------------------------------------------

        "hourly": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "precipitation_probability,"
            "precipitation,"
            "rain,"
            "showers,"
            "weather_code"
        ),

        "forecast_days": 1,

        "timezone": "auto",
    }

    last_error = None

    # ----------------------------------------------
    # Retry mechanism
    # ----------------------------------------------

    for attempt in range(
        1,
        MAX_RETRIES + 1
    ):

        try:

            print(
                f"Weather API attempt "
                f"{attempt}/{MAX_RETRIES}..."
            )

            response = requests.get(
                OPEN_METEO_URL,
                params=params,
                timeout=REQUEST_TIMEOUT,
            )

            response.raise_for_status()

            return response.json()

        except requests.RequestException as error:

            last_error = error

            print(
                f"Weather API attempt "
                f"{attempt} failed: {error}"
            )

            if attempt < MAX_RETRIES:

                print(
                    "Retrying in 2 seconds..."
                )

                time.sleep(2)

    raise RuntimeError(
        f"Weather API failed after "
        f"{MAX_RETRIES} attempts: "
        f"{last_error}"
    )


# ==================================================
# GET WEATHER + FORECAST + FLOOD RISK
# ==================================================

def get_weather_and_risk(
    latitude: float,
    longitude: float
):

    # ----------------------------------------------
    # Fetch API data
    # ----------------------------------------------

    data = fetch_weather(
        latitude,
        longitude
    )

    current = data.get(
        "current",
        {}
    )

    hourly = data.get(
        "hourly",
        {}
    )

    # ==================================================
    # CURRENT WEATHER
    # ==================================================

    temperature = float(
        current.get(
            "temperature_2m",
            0
        )
    )

    humidity = float(
        current.get(
            "relative_humidity_2m",
            0
        )
    )

    precipitation = float(
        current.get(
            "precipitation",
            0
        )
    )

    weather_code = int(
        current.get(
            "weather_code",
            0
        )
    )

    # ==================================================
    # HOURLY FORECAST DATA
    # ==================================================

    hourly_times = hourly.get(
        "time",
        []
    )

    hourly_precipitation = hourly.get(
        "precipitation",
        []
    )

    hourly_probability = hourly.get(
        "precipitation_probability",
        []
    )

    hourly_temperature = hourly.get(
        "temperature_2m",
        []
    )

    hourly_humidity = hourly.get(
        "relative_humidity_2m",
        []
    )

    hourly_weather_code = hourly.get(
        "weather_code",
        []
    )

    # ==================================================
    # NEXT 6 HOURS
    # ==================================================

    forecast_hours = 6

    next_6_hours = []

    for i in range(
        min(
            forecast_hours,
            len(hourly_times)
        )
    ):

        rainfall = 0.0

        probability = 0.0

        forecast_temperature = 0.0

        forecast_humidity = 0.0

        forecast_code = 0

        # ------------------------------------------
        # Rainfall
        # ------------------------------------------

        if i < len(
            hourly_precipitation
        ):

            rainfall = float(
                hourly_precipitation[i]
            )

        # ------------------------------------------
        # Rain probability
        # ------------------------------------------

        if i < len(
            hourly_probability
        ):

            probability = float(
                hourly_probability[i]
            )

        # ------------------------------------------
        # Temperature
        # ------------------------------------------

        if i < len(
            hourly_temperature
        ):

            forecast_temperature = float(
                hourly_temperature[i]
            )

        # ------------------------------------------
        # Humidity
        # ------------------------------------------

        if i < len(
            hourly_humidity
        ):

            forecast_humidity = float(
                hourly_humidity[i]
            )

        # ------------------------------------------
        # Weather code
        # ------------------------------------------

        if i < len(
            hourly_weather_code
        ):

            forecast_code = int(
                hourly_weather_code[i]
            )

        next_6_hours.append(
            {
                "time": hourly_times[i],

                "rainfall_mm": rainfall,

                "rain_probability": probability,

                "temperature":
                    forecast_temperature,

                "humidity":
                    forecast_humidity,

                "weather_code":
                    forecast_code,
            }
        )

    # ==================================================
    # FORECAST SUMMARY
    # ==================================================

    forecast_rainfall = sum(
        hour["rainfall_mm"]
        for hour in next_6_hours
    )

    maximum_rain_probability = max(
        (
            hour["rain_probability"]
            for hour in next_6_hours
        ),
        default=0.0
    )

    maximum_hourly_rainfall = max(
        (
            hour["rainfall_mm"]
            for hour in next_6_hours
        ),
        default=0.0
    )

    # ==================================================
    # FLOOD RISK CALCULATION
    # ==================================================

    risk = calculate_flood_risk(

        # Current rainfall
        rainfall_mm=precipitation,

        # Maximum probability in next 6 hours
        rainfall_probability=
            maximum_rain_probability,

        # Current humidity
        humidity=humidity,

        # Current temperature
        temperature=temperature,

        # Current weather condition
        weather_code=weather_code,

        # ------------------------------------------
        # NEW FORECAST INPUTS
        # ------------------------------------------

        forecast_rainfall_mm=
            forecast_rainfall,

        maximum_hourly_rainfall_mm=
            maximum_hourly_rainfall,
    )

    # ==================================================
    # FINAL RESULT
    # ==================================================

    return {

        "location": {

            "latitude": latitude,

            "longitude": longitude,
        },

        # ------------------------------------------
        # Current weather
        # ------------------------------------------

        "weather": {

            "temperature":
                temperature,

            "humidity":
                humidity,

            "precipitation":
                precipitation,

            "weather_code":
                weather_code,
        },

        # ------------------------------------------
        # Forecast
        # ------------------------------------------

        "forecast": {

            "next_6_hours":
                next_6_hours,

            "total_rainfall_mm":
                round(
                    forecast_rainfall,
                    2
                ),

            "maximum_hourly_rainfall_mm":
                round(
                    maximum_hourly_rainfall,
                    2
                ),

            "maximum_rain_probability":
                round(
                    maximum_rain_probability,
                    2
                ),
        },

        # ------------------------------------------
        # Risk
        # ------------------------------------------

        "risk": risk,
    }


# ==================================================
# DIRECT TEST
# ==================================================

if __name__ == "__main__":

    # ----------------------------------------------
    # Delhi coordinates
    # ----------------------------------------------

    latitude = 28.6139

    longitude = 77.2090

    try:

        result = get_weather_and_risk(
            latitude,
            longitude
        )

        weather = result["weather"]

        forecast = result["forecast"]

        risk = result["risk"]

        # ==========================================
        # CURRENT WEATHER
        # ==========================================

        print(
            "\n========================================"
        )

        print(
            "        CURRENT WEATHER"
        )

        print(
            "========================================"
        )

        print(
            f"Temperature: "
            f"{weather['temperature']} °C"
        )

        print(
            f"Humidity: "
            f"{weather['humidity']} %"
        )

        print(
            f"Current Rainfall: "
            f"{weather['precipitation']} mm"
        )

        print(
            f"Weather Code: "
            f"{weather['weather_code']}"
        )

        # ==========================================
        # NEXT 6 HOURS
        # ==========================================

        print(
            "\n========================================"
        )

        print(
            "        NEXT 6 HOURS FORECAST"
        )

        print(
            "========================================"
        )

        print(
            f"Forecast Rainfall: "
            f"{forecast['total_rainfall_mm']} mm"
        )

        print(
            f"Maximum Hourly Rainfall: "
            f"{forecast['maximum_hourly_rainfall_mm']} mm"
        )

        print(
            f"Maximum Rain Probability: "
            f"{forecast['maximum_rain_probability']} %"
        )

        # ==========================================
        # HOURLY FORECAST
        # ==========================================

        print(
            "\nHourly Forecast:"
        )

        for hour in forecast[
            "next_6_hours"
        ]:

            print(
                f"{hour['time']} | "
                f"Rain: "
                f"{hour['rainfall_mm']} mm | "
                f"Probability: "
                f"{hour['rain_probability']} % | "
                f"Code: "
                f"{hour['weather_code']}"
            )

        # ==========================================
        # FLOOD RISK
        # ==========================================

        print(
            "\n========================================"
        )

        print(
            "        FLOOD RISK"
        )

        print(
            "========================================"
        )

        print(
            f"Risk Score: "
            f"{risk['risk_score']}/100"
        )

        print(
            f"Risk Level: "
            f"{risk['risk_level']}"
        )

        print(
            f"Recommendation: "
            f"{risk['recommendation']}"
        )

        print(
            "\nFactors:"
        )

        for factor in risk[
            "factors"
        ]:

            print(
                f"- {factor}"
            )

    except Exception as error:

        print(
            "\nWeather service failed:"
        )

        print(error)