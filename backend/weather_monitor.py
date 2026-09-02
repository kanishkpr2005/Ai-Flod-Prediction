
import os
import time
import requests
import pandas as pd

try:
    from .alerts import create_automatic_flood_alert
except ImportError:
    from alerts import create_automatic_flood_alert


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

PREDICTION_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "latest_district_predictions.csv"
)

LOCATION_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "district_locations.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "live_weather_predictions.csv"
)

WEATHER_URL = "https://api.open-meteo.com/v1/forecast"


# ============================================================
# DISTRICT NAME ALIASES
# ============================================================

DISTRICT_ALIASES = {

    "Orissa": "Odisha",
    "Uttaranchal": "Uttarakhand",

    # Gujarat
    "Ahmadabad": "Ahmedabad",
    "Banas Kantha": "Banaskantha",
    "Panch Mahals": "Panchmahal",
    "Sabar Kantha": "Sabarkantha",
    "The Dangs": "Dang",

    # Uttar Pradesh
    "Allahabad": "Prayagraj",
    "Faizabad": "Ayodhya",
    "Bara Banki": "Barabanki",
    "Jyotiba Phule Nagar": "Amroha",
    "Sant Ravi Das Nagar": "Bhadohi",
    "Siddharth Nagar": "Siddharthnagar",

    # Uttarakhand
    "Dehra Dun": "Dehradun",
    "Naini Tal": "Nainital",
    "Rudra Prayag": "Rudraprayag",
    "Udham Singh Nagar": "Udham Singh Nagar",

    # West Bengal
    "Barddhaman": "Purba Bardhaman",
    "Haora": "Howrah",
    "Hugli": "Hooghly",
    "Kochbihar": "Cooch Behar",
    "Maldah": "Malda",
    "Darjiling": "Darjeeling",

    # Maharashtra
    "Ahmednagar": "Ahilyanagar",
    "Aurangabad": "Chhatrapati Sambhajinagar",
    "Bid": "Beed",
    "Buldana": "Buldhana",
    "Garhchiroli": "Gadchiroli",
    "Gondiya": "Gondia",
    "Greater Bombay": "Mumbai",
    "Osmanabad": "Dharashiv",

    # Karnataka
    "Belgaum": "Belagavi",
    "Bellary": "Ballari",
    "Bijapur": "Vijayapura",
    "Chamrajnagar": "Chamarajanagar",
    "Chikmagalur": "Chikkamagaluru",
    "Dakshin Kannad": "Dakshina Kannada",
    "Gulbarga": "Kalaburagi",
    "Mysore": "Mysuru",
    "Shimoga": "Shivamogga",
    "Tumkur": "Tumakuru",
    "Uttar Kannand": "Uttara Kannada",

    # Madhya Pradesh
    "Hoshangabad": "Narmadapuram",
    "East Nimar": "Khandwa",
    "West Nimar": "Khargone",

    # Jammu / Kashmir / Ladakh
    "Bagdam": "Budgam",
    "Baramula (Kashmir North)": "Baramulla",
    "Anantnag (Kashmir South)": "Anantnag",
    "Punch": "Poonch",
    "Rajauri": "Rajouri",
    "Ladakh (Leh)": "Leh",
    "Kupwara (Muzaffarabad)": "Kupwara",

    # Rajasthan
    "Chittaurgarh": "Chittorgarh",
    "Ganganagar": "Sri Ganganagar",
    "Jhunjhunun": "Jhunjhunu",
    "Jalor": "Jalore",

    # Bihar
    "Pashchim Champaran": "West Champaran",
    "Purba Champaran": "East Champaran",
    "Bhabua": "Kaimur",

    # Odisha
    "Baleshwar": "Balasore",
    "Baragarh": "Bargarh",
    "Bolangir": "Balangir",
    "Deogarh": "Debagarh",
    "Keonjhar": "Kendujhar",
    "Sonepur": "Subarnapur",

    # Tamil Nadu
    "Kancheepuram": "Kanchipuram",
    "Kanniyakumari": "Kanyakumari",
    "Nilgiris": "The Nilgiris",
    "Tirunelveli Kattabo": "Tirunelveli",

    # Assam
    "Dhuburi": "Dhubri",
    "Karimganj": "Sribhumi",
    "Marigaon": "Morigaon",
    "Sibsagar": "Sivasagar",
    "North Cachar Hills": "Dima Hasao",

    # Punjab
    "Nawan Shehar": "Shaheed Bhagat Singh Nagar",

    # Jharkhand
    "Pashchim Singhbhum": "West Singhbhum",
    "Purba Singhbhum": "East Singhbhum",

    # Himachal Pradesh
    "Lahul and Spiti": "Lahaul and Spiti",

    # Andhra Pradesh
    "Vishakhapatnam": "Visakhapatnam",
    "Rangareddi": "Rangareddy",

    # Kerala
    "Pattanamtitta": "Pathanamthitta",
}


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(value):

    if pd.isna(value):
        return ""

    return " ".join(
        str(value).strip().split()
    )


# ============================================================
# NORMALIZE STATE
# ============================================================

def normalize_state(state):

    state = clean_text(state)

    if state == "Orissa":
        return "Odisha"

    if state == "Uttaranchal":
        return "Uttarakhand"

    return state


# ============================================================
# NORMALIZE DISTRICT
# ============================================================

def normalize_district(district):

    district = clean_text(district)

    return DISTRICT_ALIASES.get(
        district,
        district
    )


# ============================================================
# LOAD MONITORED LOCATIONS
# ============================================================

def load_monitored_locations():

    print()
    print("=" * 70)
    print("LOADING ALL DISTRICT LOCATIONS")
    print("=" * 70)

    print(
        f"\nPrediction file:\n{PREDICTION_FILE}"
    )

    print(
        f"\nLocation file:\n{LOCATION_FILE}"
    )

    if not os.path.exists(PREDICTION_FILE):

        raise FileNotFoundError(
            f"Prediction file not found:\n{PREDICTION_FILE}"
        )

    if not os.path.exists(LOCATION_FILE):

        raise FileNotFoundError(
            f"District location file not found:\n{LOCATION_FILE}"
        )

    prediction_df = pd.read_csv(
        PREDICTION_FILE
    )

    location_df = pd.read_csv(
        LOCATION_FILE
    )

    print(
        f"\nPrediction rows: {len(prediction_df)}"
    )

    print(
        f"Location rows: {len(location_df)}"
    )

    required_prediction_columns = [
        "state",
        "district",
        "flood_probability",
        "risk_level",
    ]

    missing_prediction = [
        column
        for column in required_prediction_columns
        if column not in prediction_df.columns
    ]

    if missing_prediction:

        raise ValueError(
            "Prediction dataset missing columns: "
            + ", ".join(missing_prediction)
        )

    required_location_columns = [
        "state",
        "district",
        "latitude",
        "longitude",
    ]

    missing_location = [
        column
        for column in required_location_columns
        if column not in location_df.columns
    ]

    if missing_location:

        raise ValueError(
            "District location dataset missing columns: "
            + ", ".join(missing_location)
        )

    # --------------------------------------------------------
    # CLEAN NAMES
    # --------------------------------------------------------

    prediction_df["state"] = (
        prediction_df["state"]
        .apply(clean_text)
    )

    prediction_df["district"] = (
        prediction_df["district"]
        .apply(clean_text)
    )

    location_df["state"] = (
        location_df["state"]
        .apply(clean_text)
    )

    location_df["district"] = (
        location_df["district"]
        .apply(clean_text)
    )

    # --------------------------------------------------------
    # NORMALIZE NAMES
    # --------------------------------------------------------

    prediction_df["state_normalized"] = (
        prediction_df["state"]
        .apply(normalize_state)
    )

    prediction_df["district_normalized"] = (
        prediction_df["district"]
        .apply(normalize_district)
    )

    location_df["state_normalized"] = (
        location_df["state"]
        .apply(normalize_state)
    )

    location_df["district_normalized"] = (
        location_df["district"]
        .apply(normalize_district)
    )

    # --------------------------------------------------------
    # NUMERIC COORDINATES
    # --------------------------------------------------------

    location_df["latitude"] = pd.to_numeric(
        location_df["latitude"],
        errors="coerce"
    )

    location_df["longitude"] = pd.to_numeric(
        location_df["longitude"],
        errors="coerce"
    )

    location_df = location_df.dropna(
        subset=[
            "latitude",
            "longitude"
        ]
    )

    location_df = location_df.drop_duplicates(
        subset=[
            "state_normalized",
            "district_normalized"
        ]
    )

    # --------------------------------------------------------
    # MERGE
    # --------------------------------------------------------

    merged_df = prediction_df.merge(

        location_df[
            [
                "state_normalized",
                "district_normalized",
                "latitude",
                "longitude"
            ]
        ],

        on=[
            "state_normalized",
            "district_normalized"
        ],

        how="left"
    )

    # --------------------------------------------------------
    # MISSING COORDINATES
    # --------------------------------------------------------

    missing_coordinates = merged_df[
        merged_df["latitude"].isna()
        |
        merged_df["longitude"].isna()
    ]

    if not missing_coordinates.empty:

        print()
        print(
            "WARNING: DISTRICTS WITHOUT COORDINATES:"
        )

        print(
            missing_coordinates[
                [
                    "state",
                    "district"
                ]
            ].to_string(
                index=False
            )
        )

    merged_df = merged_df.dropna(
        subset=[
            "latitude",
            "longitude"
        ]
    )

    # --------------------------------------------------------
    # USE NORMALIZED NAMES
    # --------------------------------------------------------

    merged_df["state"] = (
        merged_df["state_normalized"]
    )

    merged_df["district"] = (
        merged_df["district_normalized"]
    )

    merged_df = merged_df.drop(
        columns=[
            "state_normalized",
            "district_normalized"
        ]
    )

    merged_df = merged_df.drop_duplicates(
        subset=[
            "state",
            "district"
        ]
    )

    print()
    print(
        f"Districts ready for weather monitoring: "
        f"{len(merged_df)}"
    )

    if len(merged_df) == 590:

        print(
            "SUCCESS: ALL 590 DISTRICTS READY!"
        )

    else:

        print(
            f"WARNING: Expected 590 districts, "
            f"but only {len(merged_df)} are ready."
        )

    return merged_df


# ============================================================
# WEATHER API
# ============================================================

def get_weather(
    latitude,
    longitude
):

    params = {

        "latitude": latitude,

        "longitude": longitude,

        "current": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "precipitation,"
            "rain,"
            "showers,"
            "weather_code"
        ),

        "hourly": (
            "precipitation_probability,"
            "precipitation,"
            "rain"
        ),

        "forecast_days": 3,

        "timezone": "auto",
    }

    try:

        response = requests.get(
            WEATHER_URL,
            params=params,
            timeout=10
        )

        if response.status_code != 200:

            print(
                f"Weather API HTTP error: "
                f"{response.status_code}"
            )

            return None

        return response.json()

    except requests.exceptions.Timeout:

        print(
            "Weather API timeout."
        )

        return None

    except Exception as error:

        print(
            f"Weather API error: {error}"
        )

        return None


# ============================================================
# CALCULATE WEATHER PROBABILITY
# ============================================================

def calculate_weather_probability(
    weather_data
):

    if weather_data is None:
        return None

    probability_values = []
    rain_values = []
    precipitation_values = []

    hourly = weather_data.get(
        "hourly",
        {}
    )

    precipitation_probability = hourly.get(
        "precipitation_probability",
        []
    )

    precipitation = hourly.get(
        "precipitation",
        []
    )

    rain = hourly.get(
        "rain",
        []
    )

    # --------------------------------------------------------
    # PRECIPITATION PROBABILITY
    # --------------------------------------------------------

    for value in precipitation_probability:

        if value is not None:

            probability_values.append(
                float(value)
            )

    # --------------------------------------------------------
    # RAIN
    # --------------------------------------------------------

    for value in rain:

        if value is not None:

            rain_values.append(
                float(value)
            )

    # --------------------------------------------------------
    # PRECIPITATION
    # --------------------------------------------------------

    for value in precipitation:

        if value is not None:

            precipitation_values.append(
                float(value)
            )

    # --------------------------------------------------------
    # BASE PROBABILITY
    # --------------------------------------------------------

    if probability_values:

        max_probability = max(
            probability_values
        )

    else:

        max_probability = 0.0

    # --------------------------------------------------------
    # RAIN SIGNAL
    # --------------------------------------------------------

    max_rain = (
        max(rain_values)
        if rain_values
        else 0.0
    )

    # --------------------------------------------------------
    # PRECIPITATION SIGNAL
    # --------------------------------------------------------

    max_precipitation = (
        max(precipitation_values)
        if precipitation_values
        else 0.0
    )

    # --------------------------------------------------------
    # CONVERT TO RISK SIGNAL
    # --------------------------------------------------------

    rain_probability = min(
        max_rain / 20.0,
        1.0
    ) * 100.0

    precipitation_probability_signal = min(
        max_precipitation / 30.0,
        1.0
    ) * 100.0

    # --------------------------------------------------------
    # FINAL WEATHER PROBABILITY
    # --------------------------------------------------------

    weather_probability = max(
        max_probability,
        rain_probability,
        precipitation_probability_signal
    )

    weather_probability = max(
        0.0,
        min(
            weather_probability,
            100.0
        )
    )

    return weather_probability / 100.0


# ============================================================
# FINAL PROBABILITY
# ============================================================

def calculate_final_probability(
    rainfall_probability,
    weather_probability
):

    rainfall_probability = float(
        rainfall_probability
    )

    # --------------------------------------------------------
    # WEATHER UNAVAILABLE
    # --------------------------------------------------------

    if weather_probability is None:

        return max(
            0.0,
            min(
                rainfall_probability,
                1.0
            )
        )

    # --------------------------------------------------------
    # ML = 70%
    # WEATHER = 30%
    # --------------------------------------------------------

    final_probability = (

        rainfall_probability * 0.70

        +

        weather_probability * 0.30

    )

    return max(
        0.0,
        min(
            final_probability,
            1.0
        )
    )


# ============================================================
# RISK LEVEL
# ============================================================

def get_risk_level(
    probability
):

    if probability >= 0.70:

        return "HIGH"

    elif probability >= 0.40:

        return "MEDIUM"

    else:

        return "LOW"


# ============================================================
# MONITOR ALL DISTRICTS
# ============================================================

def monitor_all_districts():

    locations_df = load_monitored_locations()

    print()
    print("=" * 70)
    print("STARTING LIVE WEATHER MONITOR")
    print("=" * 70)

    results = []

    total = len(
        locations_df
    )

    # ========================================================
    # LOOP THROUGH ALL DISTRICTS
    # ========================================================

    for index, row in locations_df.iterrows():

        state = row["state"]

        district = row["district"]

        latitude = float(
            row["latitude"]
        )

        longitude = float(
            row["longitude"]
        )

        rainfall_probability = float(
            row["flood_probability"]
        )

        print(
            f"\n[{index + 1}/{total}] "
            f"{district}, {state}"
        )

        print(
            f"Coordinates: "
            f"{latitude:.4f}, "
            f"{longitude:.4f}"
        )

        # ----------------------------------------------------
        # LIVE WEATHER
        # ----------------------------------------------------

        weather_data = get_weather(
            latitude,
            longitude
        )

        weather_probability = (
            calculate_weather_probability(
                weather_data
            )
        )

        # ----------------------------------------------------
        # FINAL PROBABILITY
        # ----------------------------------------------------

        final_probability = (
            calculate_final_probability(
                rainfall_probability,
                weather_probability
            )
        )

        # ----------------------------------------------------
        # RISK
        # ----------------------------------------------------

        risk_level = get_risk_level(
            final_probability
        )

        # ====================================================
        # AUTOMATIC ALERT
        # ====================================================

        alert_result = (
            create_automatic_flood_alert(

                state=state,

                district=district,

                latitude=latitude,

                longitude=longitude,

                final_probability=final_probability,

                risk_level=risk_level
            )
        )

        # ----------------------------------------------------
        # PRINT RESULT
        # ----------------------------------------------------

        print(
            f"Rainfall ML: "
            f"{rainfall_probability * 100:.1f}%"
        )

        if weather_probability is None:

            print(
                "Live weather: UNAVAILABLE"
            )

            print(
                f"Final probability: "
                f"{final_probability * 100:.1f}% "
                f"(ML fallback)"
            )

        else:

            print(
                f"Live weather: "
                f"{weather_probability * 100:.1f}%"
            )

            print(
                f"Final probability: "
                f"{final_probability * 100:.1f}%"
            )

        print(
            f"Risk: {risk_level}"
        )

        # ----------------------------------------------------
        # ALERT STATUS
        # ----------------------------------------------------

        if alert_result.get("created"):

            print(
                "🚨 Automatic alert CREATED"
            )

        elif alert_result.get("duplicate"):

            print(
                "ℹ️ Active alert already exists"
            )

        # ----------------------------------------------------
        # SAVE RESULT
        # ----------------------------------------------------

        results.append({

            "state":
                state,

            "district":
                district,

            "latitude":
                latitude,

            "longitude":
                longitude,

            "rainfall_ml_probability":
                rainfall_probability,

            "weather_probability":
                (
                    weather_probability
                    if weather_probability is not None
                    else 0.0
                ),

            "final_flood_probability":
                final_probability,

            "risk_level":
                risk_level,

            "weather_data_available":
                weather_data is not None,

        })

        # ----------------------------------------------------
        # API DELAY
        # ----------------------------------------------------

        time.sleep(
            0.15
        )

    # ========================================================
    # CREATE DATAFRAME
    # ========================================================

    result_df = pd.DataFrame(
        results
    )

    # ========================================================
    # SORT BY RISK
    # ========================================================

    result_df = result_df.sort_values(
        by="final_flood_probability",
        ascending=False
    )

    # ========================================================
    # SAVE RESULTS
    # ========================================================

    result_df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    # ========================================================
    # SUMMARY
    # ========================================================

    print()
    print("=" * 70)
    print("LIVE WEATHER MONITOR COMPLETE")
    print("=" * 70)

    print(
        f"\nTotal districts monitored: "
        f"{len(result_df)}"
    )

    print(
        "\nWeather API availability:"
    )

    available_count = result_df[
        "weather_data_available"
    ].sum()

    unavailable_count = (
        len(result_df)
        - available_count
    )

    print(
        f"Available: {available_count}"
    )

    print(
        f"Unavailable: {unavailable_count}"
    )

    print(
        "\nRisk distribution:"
    )

    print(
        result_df[
            "risk_level"
        ].value_counts()
    )

    # ========================================================
    # HIGH RISK
    # ========================================================

    high_risk = result_df[
        result_df["risk_level"] == "HIGH"
    ]

    print()
    print(
        "Automatic HIGH-risk alerts:"
    )

    print(
        len(high_risk)
    )

    # ========================================================
    # TOP 20
    # ========================================================

    print()
    print(
        "TOP 20 FLOOD RISKS"
    )

    print("=" * 70)

    display_columns = [

        "state",

        "district",

        "rainfall_ml_probability",

        "weather_probability",

        "final_flood_probability",

        "risk_level",

    ]

    print(
        result_df[
            display_columns
        ]
        .head(20)
        .to_string(
            index=False
        )
    )

    # ========================================================
    # OUTPUT
    # ========================================================

    print()
    print(
        "Output:"
    )

    print(
        os.path.abspath(
            OUTPUT_FILE
        )
    )

    print("=" * 70)

    return result_df


# ============================================================
# BACKGROUND MONITORING CYCLE
# ============================================================

def run_monitoring_cycle():

    print()
    print("=" * 70)
    print("AUTOMATIC WEATHER MONITORING CYCLE")
    print("=" * 70)

    try:

        result = monitor_all_districts()

        print()
        print("=" * 70)
        print("MONITORING CYCLE FINISHED")
        print("=" * 70)

        return result

    except Exception as error:

        print()
        print("=" * 70)
        print("MONITORING CYCLE ERROR")
        print("=" * 70)

        print(error)

        raise


# ============================================================
# DIRECT RUN
# ============================================================

if __name__ == "__main__":

    run_monitoring_cycle()
