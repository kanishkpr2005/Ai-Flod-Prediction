import os
import time
import requests
import pandas as pd

# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = r"data\processed\latest_district_predictions.csv"
OUTPUT_FILE = r"data\processed\district_locations.csv"
GEOCODE_CACHE_FILE = r"data\processed\district_geocode_cache.csv"

GEOCODING_URL = "https://nominatim.openstreetmap.org/search"

HEADERS = {
    "User-Agent": "disaster-management-system/1.0"
}

# ============================================================
# DISTRICT NAME ALIASES
# ============================================================

DISTRICT_ALIASES = {

    # ========================================================
    # STATES / OLD NAMES
    # ========================================================

    "Orissa": "Odisha",
    "Uttaranchal": "Uttarakhand",

    # ========================================================
    # GUJARAT
    # ========================================================

    "Ahmadabad": "Ahmedabad",
    "Banas Kantha": "Banaskantha",
    "Panch Mahals": "Panchmahal",
    "Sabar Kantha": "Sabarkantha",
    "The Dangs": "Dang",

    # ========================================================
    # UTTAR PRADESH
    # ========================================================

    "Allahabad": "Prayagraj",
    "Faizabad": "Ayodhya",
    "Bara Banki": "Barabanki",
    "Jyotiba Phule Nagar": "Amroha",
    "Sant Ravi Das Nagar": "Bhadohi",
    "Siddharth Nagar": "Siddharthnagar",

    # ========================================================
    # UTTARAKHAND
    # ========================================================

    "Dehra Dun": "Dehradun",
    "Naini Tal": "Nainital",
    "Rudra Prayag": "Rudraprayag",

    # ========================================================
    # WEST BENGAL
    # ========================================================

    "Barddhaman": "Purba Bardhaman",
    "Haora": "Howrah",
    "Hugli": "Hooghly",
    "Kochbihar": "Cooch Behar",
    "Maldah": "Malda",
    "Darjiling": "Darjeeling",

    # ========================================================
    # MAHARASHTRA
    # ========================================================

    "Ahmednagar": "Ahilyanagar",
    "Aurangabad": "Chhatrapati Sambhajinagar",
    "Bid": "Beed",
    "Buldana": "Buldhana",
    "Garhchiroli": "Gadchiroli",
    "Gondiya": "Gondia",
    "Greater Bombay": "Mumbai",
    "Osmanabad": "Dharashiv",

    # ========================================================
    # KARNATAKA
    # ========================================================

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

    # ========================================================
    # MADHYA PRADESH
    # ========================================================

    "Hoshangabad": "Narmadapuram",
    "East Nimar": "Khandwa",
    "West Nimar": "Khargone",

    # ========================================================
    # JAMMU / KASHMIR / LADAKH
    # ========================================================

    "Bagdam": "Budgam",
    "Baramula (Kashmir North)": "Baramulla",
    "Anantnag (Kashmir South)": "Anantnag",
    "Punch": "Poonch",
    "Rajauri": "Rajouri",
    "Ladakh (Leh)": "Leh",
    "Kupwara (Muzaffarabad)": "Kupwara",

    # ========================================================
    # RAJASTHAN
    # ========================================================

    "Chittaurgarh": "Chittorgarh",
    "Ganganagar": "Sri Ganganagar",
    "Jhunjhunun": "Jhunjhunu",
    "Jalor": "Jalore",

    # ========================================================
    # BIHAR
    # ========================================================

    "Pashchim Champaran": "West Champaran",
    "Purba Champaran": "East Champaran",
    "Bhabua": "Kaimur",

    # ========================================================
    # ODISHA
    # ========================================================

    "Baleshwar": "Balasore",
    "Baragarh": "Bargarh",
    "Bolangir": "Balangir",
    "Deogarh": "Debagarh",
    "Keonjhar": "Kendujhar",
    "Sonepur": "Subarnapur",

    # ========================================================
    # TAMIL NADU
    # ========================================================

    "Kancheepuram": "Kanchipuram",
    "Kanniyakumari": "Kanyakumari",
    "Nilgiris": "The Nilgiris",
    "Tirunelveli Kattabo": "Tirunelveli",

    # ========================================================
    # PUNJAB
    # ========================================================

    "Nawan Shehar": "Shaheed Bhagat Singh Nagar",

    # ========================================================
    # JHARKHAND
    # ========================================================

    "Pashchim Singhbhum": "West Singhbhum",
    "Purba Singhbhum": "East Singhbhum",

    # ========================================================
    # ANDHRA PRADESH
    # ========================================================

    "Vishakhapatnam": "Visakhapatnam",
    "Rangareddi": "Rangareddy",

    # ========================================================
    # HIMACHAL PRADESH
    # ========================================================

    "Lahul and Spiti": "Lahaul and Spiti",

    # ========================================================
    # ASSAM
    # ========================================================

    "Dhuburi": "Dhubri",
    "Marigaon": "Morigaon",
    "Sibsagar": "Sivasagar",
    "North Cachar Hills": "Dima Hasao",

    # ========================================================
    # OTHER COMMON SPELLINGS
    # ========================================================

    "Pashchim Champaran": "West Champaran",
    "Purba Champaran": "East Champaran",
}


# ============================================================
# MANUAL HIGH-CONFIDENCE COORDINATES
# ============================================================
#
# District headquarters / representative locations.
#
# IMPORTANT:
# This dictionary MUST be defined before it is used.
# ============================================================

MANUAL_COORDINATES = {

    # ========================================================
    # RAJASTHAN
    # ========================================================

    ("Rajasthan", "Karauli"): (26.4947, 77.0169),
    ("Rajasthan", "Dhaulpur"): (26.7025, 77.8934),
    ("Rajasthan", "Ajmer"): (26.4499, 74.6399),
    ("Rajasthan", "Alwar"): (27.5530, 76.6346),
    ("Rajasthan", "Bharatpur"): (27.2152, 77.5030),
    ("Rajasthan", "Kota"): (25.2138, 75.8648),
    ("Rajasthan", "Jaipur"): (26.9124, 75.7873),
    ("Rajasthan", "Jodhpur"): (26.2389, 73.0243),
    ("Rajasthan", "Udaipur"): (24.5854, 73.7125),

    # ========================================================
    # UTTAR PRADESH
    # ========================================================

    ("Uttar Pradesh", "Azamgarh"): (26.0737, 83.1859),
    ("Uttar Pradesh", "Agra"): (27.1767, 78.0081),
    ("Uttar Pradesh", "Lucknow"): (26.8467, 80.9462),
    ("Uttar Pradesh", "Kanpur"): (26.4499, 80.3319),
    ("Uttar Pradesh", "Prayagraj"): (25.4358, 81.8463),
    ("Uttar Pradesh", "Varanasi"): (25.3176, 82.9739),
    ("Uttar Pradesh", "Gorakhpur"): (26.7606, 83.3732),

    # ========================================================
    # BIHAR
    # ========================================================

    ("Bihar", "Siwan"): (26.2196, 84.3567),
    ("Bihar", "Purnia"): (25.7771, 87.4753),
    ("Bihar", "Patna"): (25.5941, 85.1376),
    ("Bihar", "Muzaffarpur"): (26.1209, 85.3647),
    ("Bihar", "Gaya"): (24.7914, 85.0002),
    ("Bihar", "Bhagalpur"): (25.2425, 86.9842),

    # ========================================================
    # MADHYA PRADESH
    # ========================================================

    ("Madhya Pradesh", "Tikamgarh"): (24.7437, 78.8308),
    ("Madhya Pradesh", "Bhind"): (26.5587, 78.7873),
    ("Madhya Pradesh", "Balaghat"): (21.8106, 80.1810),
    ("Madhya Pradesh", "Bhopal"): (23.2599, 77.4126),
    ("Madhya Pradesh", "Indore"): (22.7196, 75.8577),
    ("Madhya Pradesh", "Jabalpur"): (23.1815, 79.9864),
    ("Madhya Pradesh", "Gwalior"): (26.2183, 78.1828),

    # ========================================================
    # ASSAM
    # ========================================================

    ("Assam", "Dibrugarh"): (27.4728, 94.9120),
    ("Assam", "Guwahati"): (26.1445, 91.7362),

    # ========================================================
    # SIKKIM
    # ========================================================

    ("Sikkim", "North Sikkim"): (27.9000, 88.6000),
    ("Sikkim", "East"): (27.3300, 88.6200),
    ("Sikkim", "South Sikkim"): (27.1700, 88.5600),
    ("Sikkim", "West Sikkim"): (27.3000, 88.2300),

    # ========================================================
    # CHHATTISGARH
    # ========================================================

    ("Chhattisgarh", "Kawardha"): (22.0100, 81.2300),
    ("Chhattisgarh", "Raipur"): (21.2514, 81.6296),

    # ========================================================
    # MIZORAM
    # ========================================================

    ("Mizoram", "Champhai"): (23.4656, 93.3281),
    ("Mizoram", "Aizawl"): (23.7271, 92.7176),

    # ========================================================
    # GUJARAT
    # ========================================================

    ("Gujarat", "Navsari"): (20.9467, 72.9520),
    ("Gujarat", "Rajkot"): (22.3039, 70.8022),
    ("Gujarat", "Ahmedabad"): (23.0225, 72.5714),

    # ========================================================
    # WEST BENGAL
    # ========================================================

    ("West Bengal", "North 24 Parganas"): (22.6167, 88.4000),
    ("West Bengal", "Nadia"): (23.4700, 88.5565),
    ("West Bengal", "Kolkata"): (22.5726, 88.3639),

    # ========================================================
    # NAGALAND
    # ========================================================

    ("Nagaland", "Kohima"): (25.6751, 94.1086),

    # ========================================================
    # ARUNACHAL PRADESH
    # ========================================================

    ("Arunachal Pradesh", "Upper Dibang Valley"):
        (28.8000, 95.7000),

    # ========================================================
    # MAHARASHTRA
    # ========================================================

    ("Maharashtra", "Nashik"): (19.9975, 73.7898),
    ("Maharashtra", "Mumbai"): (19.0760, 72.8777),
    ("Maharashtra", "Pune"): (18.5204, 73.8567),

    # ========================================================
    # THE 8 DISTRICTS THAT WERE MISSING
    # ========================================================

    # Jharkhand
    ("Jharkhand", "West Singhbhum"):
        (22.5580, 85.7880),

    ("Jharkhand", "East Singhbhum"):
        (22.8046, 86.2029),

    # Andhra Pradesh
    ("Andhra Pradesh", "Visakhapatnam"):
        (17.6868, 83.2185),

    ("Andhra Pradesh", "Rangareddy"):
        (17.4065, 78.4772),

    # Himachal Pradesh
    ("Himachal Pradesh", "Lahaul and Spiti"):
        (32.5700, 77.0300),

    # Jammu & Kashmir
    ("Jammu and Kashmir", "Kupwara"):
        (34.5260, 74.2560),

    # Tamil Nadu
    ("Tamil Nadu", "Tirunelveli"):
        (8.7139, 77.7567),

    # Punjab
    ("Punjab", "Shaheed Bhagat Singh Nagar"):
        (31.1250, 76.1160),
    ("Kerala", "Pattanamtitta"): (9.2648, 76.7870),
    ("Kerala", "Pathanamthitta"): (9.2648, 76.7870),
}


# ============================================================
# HELPERS
# ============================================================

def clean_text(value):
    if pd.isna(value):
        return ""

    return " ".join(
        str(value).strip().split()
    )


def normalize_state(state):

    state = clean_text(state)

    if state == "Orissa":
        return "Odisha"

    if state == "Uttaranchal":
        return "Uttarakhand"

    return state


def normalize_district(district):

    district = clean_text(district)

    return DISTRICT_ALIASES.get(
        district,
        district
    )


# ============================================================
# LOAD CACHE
# ============================================================

def load_cache():

    if not os.path.exists(GEOCODE_CACHE_FILE):
        return {}

    try:

        cache_df = pd.read_csv(
            GEOCODE_CACHE_FILE
        )

        cache = {}

        for _, row in cache_df.iterrows():

            state = clean_text(
                row.get("state", "")
            )

            district = clean_text(
                row.get("district", "")
            )

            lat = pd.to_numeric(
                row.get("latitude"),
                errors="coerce"
            )

            lon = pd.to_numeric(
                row.get("longitude"),
                errors="coerce"
            )

            if (
                state
                and district
                and pd.notna(lat)
                and pd.notna(lon)
            ):

                cache[
                    (state, district)
                ] = (
                    float(lat),
                    float(lon)
                )

        print(
            f"Loaded {len(cache)} cached coordinates."
        )

        return cache

    except Exception as e:

        print(
            f"WARNING: Could not load cache: {e}"
        )

        return {}


# ============================================================
# SAVE CACHE
# ============================================================

def save_cache(cache):

    rows = []

    for (
        state,
        district
    ), (
        latitude,
        longitude
    ) in cache.items():

        rows.append({

            "state": state,

            "district": district,

            "latitude": latitude,

            "longitude": longitude,

        })

    cache_df = pd.DataFrame(rows)

    os.makedirs(
        os.path.dirname(
            GEOCODE_CACHE_FILE
        ),
        exist_ok=True
    )

    cache_df.to_csv(
        GEOCODE_CACHE_FILE,
        index=False
    )


# ============================================================
# ONLINE GEOCODING
# ============================================================

def geocode_district(
    district,
    state
):

    queries = [

        f"{district}, {state}, India",

        f"{district} district, {state}, India",

        f"{district}, India",

    ]

    for query in queries:

        try:

            response = requests.get(

                GEOCODING_URL,

                params={

                    "q": query,

                    "format": "json",

                    "limit": 1,

                    "countrycodes": "in",

                },

                headers=HEADERS,

                timeout=15

            )

            if response.status_code != 200:
                continue

            results = response.json()

            if not results:
                continue

            result = results[0]

            latitude = float(
                result["lat"]
            )

            longitude = float(
                result["lon"]
            )

            # =================================================
            # INDIA SANITY CHECK
            # =================================================

            if not (
                6 <= latitude <= 38
                and
                68 <= longitude <= 98
            ):
                continue

            return (
                latitude,
                longitude
            )

        except Exception:
            continue

        finally:

            # Nominatim rate-limit protection
            time.sleep(1.1)

    return None


# ============================================================
# MAIN
# ============================================================

print("=" * 70)

print(
    "BUILDING COMPLETE DISTRICT LOCATION DATASET"
)

print("=" * 70)


# ============================================================
# LOAD PREDICTION DATA
# ============================================================

if not os.path.exists(INPUT_FILE):

    raise FileNotFoundError(

        f"\nInput file not found:\n"
        f"{os.path.abspath(INPUT_FILE)}"

    )


df = pd.read_csv(
    INPUT_FILE
)


print(
    f"\nPrediction rows: {len(df)}"
)


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [
    "state",
    "district"
]


missing_columns = [

    column

    for column in required_columns

    if column not in df.columns

]


if missing_columns:

    raise ValueError(

        "Missing required columns: "
        + ", ".join(missing_columns)

    )


# ============================================================
# NORMALIZE DATA
# ============================================================

df["original_state"] = df["state"].apply(
    clean_text
)

df["original_district"] = df["district"].apply(
    clean_text
)

df["state_normalized"] = df["state"].apply(
    normalize_state
)

df["district_normalized"] = df["district"].apply(
    normalize_district
)


# ============================================================
# UNIQUE DISTRICTS
# ============================================================

locations = (

    df[
        [
            "state_normalized",
            "district_normalized"
        ]
    ]

    .drop_duplicates()

)


print(
    f"Unique district/state combinations: "
    f"{len(locations)}"
)


# ============================================================
# LOAD EXISTING CACHE
# ============================================================

cache = load_cache()


# ============================================================
# ADD MANUAL COORDINATES
# ============================================================

print(
    f"Manual coordinate entries: "
    f"{len(MANUAL_COORDINATES)}"
)


for key, coords in MANUAL_COORDINATES.items():

    if key not in cache:

        cache[key] = coords


# ============================================================
# RESOLVE COORDINATES
# ============================================================

resolved_rows = []

missing_rows = []


for index, row in locations.iterrows():

    state = row[
        "state_normalized"
    ]

    district = row[
        "district_normalized"
    ]

    key = (
        state,
        district
    )


    # ========================================================
    # CACHE / MANUAL
    # ========================================================

    if key in cache:

        latitude, longitude = cache[key]

        resolved_rows.append({

            "state": state,

            "district": district,

            "latitude": latitude,

            "longitude": longitude,

            "coordinate_source": "cache/manual",

        })

        continue


    # ========================================================
    # ONLINE GEOCODING
    # ========================================================

    print(
        f"\nGeocoding: {district}, {state}"
    )

    coords = geocode_district(
        district,
        state
    )


    if coords is not None:

        latitude, longitude = coords

        cache[key] = coords

        resolved_rows.append({

            "state": state,

            "district": district,

            "latitude": latitude,

            "longitude": longitude,

            "coordinate_source": "OpenStreetMap",

        })

        print(
            f"  FOUND: "
            f"{latitude:.6f}, "
            f"{longitude:.6f}"
        )

    else:

        missing_rows.append({

            "state": state,

            "district": district,

        })

        print(
            "  NOT FOUND"
        )


# ============================================================
# SAVE CACHE
# ============================================================

save_cache(
    cache
)


# ============================================================
# BUILD FINAL DATASET
# ============================================================

locations_df = pd.DataFrame(
    resolved_rows
)


if locations_df.empty:

    raise RuntimeError(
        "No coordinates could be resolved."
    )


# ============================================================
# CLEAN COORDINATES
# ============================================================

locations_df["latitude"] = pd.to_numeric(

    locations_df["latitude"],

    errors="coerce"

)

locations_df["longitude"] = pd.to_numeric(

    locations_df["longitude"],

    errors="coerce"

)


locations_df = locations_df.dropna(

    subset=[
        "latitude",
        "longitude"
    ]

)


# ============================================================
# INDIA BOUNDARY CHECK
# ============================================================

locations_df = locations_df[

    locations_df["latitude"].between(
        6,
        38
    )

    &

    locations_df["longitude"].between(
        68,
        98
    )

]


# ============================================================
# REMOVE DUPLICATES
# ============================================================

locations_df = locations_df.drop_duplicates(

    subset=[
        "state",
        "district"
    ]

)


# ============================================================
# SORT DATASET
# ============================================================

locations_df = locations_df.sort_values(

    by=[
        "state",
        "district"
    ]

).reset_index(drop=True)


# ============================================================
# SAVE FINAL DATASET
# ============================================================

os.makedirs(

    os.path.dirname(
        OUTPUT_FILE
    ),

    exist_ok=True

)


locations_df.to_csv(

    OUTPUT_FILE,

    index=False

)


# ============================================================
# FINAL SUMMARY
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "DISTRICT LOCATION DATASET CREATED"
)

print(
    "=" * 70
)


print(
    f"\nPrediction rows: "
    f"{len(df)}"
)


print(
    f"Unique requested districts: "
    f"{len(locations)}"
)


print(
    f"Coordinates matched: "
    f"{len(locations_df)}"
)


print(
    f"Coordinates missing: "
    f"{len(missing_rows)}"
)


# ============================================================
# MISSING DISTRICTS
# ============================================================

if missing_rows:

    print(
        "\nWARNING: Some districts still need coordinates:"
    )

    missing_df = pd.DataFrame(
        missing_rows
    )

    print(
        missing_df.to_string(
            index=False
        )
    )

else:

    print(
        "\nSUCCESS: ALL DISTRICTS HAVE COORDINATES!"
    )


# ============================================================
# OUTPUT
# ============================================================

print(
    "\nOutput:"
)

print(
    os.path.abspath(
        OUTPUT_FILE
    )
)


print(
    "\nCoordinate cache:"
)

print(
    os.path.abspath(
        GEOCODE_CACHE_FILE
    )
)


# ============================================================
# SAMPLE
# ============================================================

print(
    "\nSample:"
)

print(

    locations_df.head(20).to_string(
        index=False
    )

)


print(
    "\n" + "=" * 70
)

print(
    "COMPLETE"
)

print(
    "=" * 70
)