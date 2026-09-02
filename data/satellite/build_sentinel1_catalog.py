import os
import time
import requests
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
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
    "satellite",
    "processed",
    "sentinel1_catalog.csv"
)

# Current Copernicus Data Space STAC API
STAC_SEARCH_URL = (
    "https://stac.dataspace.copernicus.eu/v1/search"
)

COLLECTION = "sentinel-1-grd"


# ============================================================
# DATASET SETTINGS
# ============================================================

# Pilot period first.
# Once this works, we can expand the period.

START_DATE = "2024-01-01T00:00:00Z"
END_DATE = "2024-12-31T23:59:59Z"

# Search radius around each district coordinate.
# Approximately 25 km bounding box.
SEARCH_RADIUS_DEGREES = 0.25

# Maximum scenes returned per district.
MAX_SCENES_PER_DISTRICT = 5

# Small delay between requests.
REQUEST_DELAY = 0.2

TIMEOUT = 30


# ============================================================
# CREATE DIRECTORIES
# ============================================================

os.makedirs(
    os.path.dirname(OUTPUT_FILE),
    exist_ok=True
)


# ============================================================
# LOAD DISTRICT LOCATIONS
# ============================================================

def load_district_locations():

    print()
    print("=" * 70)
    print("LOADING DISTRICT LOCATIONS")
    print("=" * 70)

    print(
        f"\nLocation file:\n{LOCATION_FILE}"
    )

    if not os.path.exists(LOCATION_FILE):

        raise FileNotFoundError(
            f"\nDistrict location file not found:\n"
            f"{LOCATION_FILE}"
        )

    df = pd.read_csv(
        LOCATION_FILE
    )

    required_columns = [
        "state",
        "district",
        "latitude",
        "longitude",
    ]

    missing = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing:

        raise ValueError(
            "Missing columns: "
            + ", ".join(missing)
        )

    # Clean text
    df["state"] = (
        df["state"]
        .astype(str)
        .str.strip()
    )

    df["district"] = (
        df["district"]
        .astype(str)
        .str.strip()
    )

    # Numeric coordinates
    df["latitude"] = pd.to_numeric(
        df["latitude"],
        errors="coerce"
    )

    df["longitude"] = pd.to_numeric(
        df["longitude"],
        errors="coerce"
    )

    # Remove invalid coordinates
    df = df.dropna(
        subset=[
            "latitude",
            "longitude"
        ]
    )

    # Remove duplicates
    df = df.drop_duplicates(
        subset=[
            "state",
            "district"
        ]
    )

    print(
        f"\nDistricts loaded: {len(df)}"
    )

    if len(df) == 590:

        print(
            "SUCCESS: ALL 590 DISTRICTS LOADED!"
        )

    else:

        print(
            f"WARNING: Expected 590, "
            f"found {len(df)}"
        )

    return df


# ============================================================
# BUILD BBOX
# ============================================================

def create_bbox(
    latitude,
    longitude
):

    west = longitude - SEARCH_RADIUS_DEGREES
    south = latitude - SEARCH_RADIUS_DEGREES
    east = longitude + SEARCH_RADIUS_DEGREES
    north = latitude + SEARCH_RADIUS_DEGREES

    # Keep bbox inside valid geographic longitude range
    west = max(-180.0, west)
    east = min(180.0, east)

    south = max(-90.0, south)
    north = min(90.0, north)

    return [
        west,
        south,
        east,
        north
    ]


# ============================================================
# SEARCH SENTINEL-1
# ============================================================

def search_sentinel1(
    latitude,
    longitude
):

    bbox = create_bbox(
        latitude,
        longitude
    )

    payload = {

        "collections": [
            COLLECTION
        ],

        "bbox": bbox,

        "datetime": (
            f"{START_DATE}/"
            f"{END_DATE}"
        ),

        "limit": MAX_SCENES_PER_DISTRICT,

        "sortby": [
            {
                "field": "datetime",
                "direction": "desc"
            }
        ]

    }

    try:

        response = requests.post(
            STAC_SEARCH_URL,
            json=payload,
            timeout=TIMEOUT
        )

        if response.status_code != 200:

            print(
                f"    STAC HTTP error: "
                f"{response.status_code}"
            )

            return []

        data = response.json()

        features = data.get(
            "features",
            []
        )

        return features

    except requests.exceptions.Timeout:

        print(
            "    STAC request timeout."
        )

        return []

    except requests.exceptions.RequestException as e:

        print(
            f"    STAC request error: {e}"
        )

        return []

    except Exception as e:

        print(
            f"    Unexpected error: {e}"
        )

        return []


# ============================================================
# EXTRACT SCENE INFORMATION
# ============================================================

def extract_scene_metadata(
    feature,
    state,
    district,
    latitude,
    longitude
):

    properties = feature.get(
        "properties",
        {}
    )

    geometry = feature.get(
        "geometry"
    )

    bbox = feature.get(
        "bbox"
    )

    scene_id = feature.get(
        "id",
        ""
    )

    datetime_value = properties.get(
        "datetime"
    )

    platform = properties.get(
        "platform",
        ""
    )

    instrument = properties.get(
        "instruments"
    )

    if isinstance(
        instrument,
        list
    ):

        instrument = ",".join(
            str(x)
            for x in instrument
        )

    # Sentinel-1 specific fields
    orbit_state = properties.get(
        "sat:orbit_state",
        ""
    )

    instrument_mode = properties.get(
        "sar:instrument_mode",
        ""
    )

    polarization = properties.get(
        "s1:polarization",
        ""
    )

    resolution = properties.get(
        "s1:resolution",
        ""
    )

    timeliness = properties.get(
        "s1:timeliness",
        ""
    )

    # Asset URLs
    assets = feature.get(
        "assets",
        {}
    )

    asset_keys = list(
        assets.keys()
    )

    asset_urls = []

    for key, asset in assets.items():

        href = asset.get(
            "href"
        )

        if href:

            asset_urls.append(
                str(href)
            )

    return {

        "state":
            state,

        "district":
            district,

        "district_latitude":
            latitude,

        "district_longitude":
            longitude,

        "scene_id":
            scene_id,

        "acquisition_datetime":
            datetime_value,

        "platform":
            platform,

        "instrument":
            instrument,

        "orbit_state":
            orbit_state,

        "instrument_mode":
            instrument_mode,

        "polarization":
            polarization,

        "resolution":
            resolution,

        "timeliness":
            timeliness,

        "bbox":
            str(bbox),

        "asset_keys":
            ",".join(asset_keys),

        "asset_urls":
            " | ".join(asset_urls),

        "collection":
            COLLECTION,

        "source":
            "Copernicus Data Space STAC",

    }


# ============================================================
# MAIN CATALOG BUILDER
# ============================================================

def build_catalog():

    print()
    print("=" * 70)
    print("SENTINEL-1 SATELLITE CATALOG BUILDER")
    print("=" * 70)

    print(
        f"\nCollection: {COLLECTION}"
    )

    print(
        f"Date range: "
        f"{START_DATE} -> {END_DATE}"
    )

    print(
        f"Search radius: "
        f"~{SEARCH_RADIUS_DEGREES} degrees"
    )

    locations = load_district_locations()

    results = []

    districts_with_scenes = 0
    districts_without_scenes = 0

    total = len(
        locations
    )

    # --------------------------------------------------------
    # Search each district
    # --------------------------------------------------------

    for index, row in locations.iterrows():

        state = row[
            "state"
        ]

        district = row[
            "district"
        ]

        latitude = float(
            row[
                "latitude"
            ]
        )

        longitude = float(
            row[
                "longitude"
            ]
        )

        print()
        print(
            f"[{index + 1}/{total}] "
            f"{district}, {state}"
        )

        print(
            f"    Coordinates: "
            f"{latitude:.4f}, "
            f"{longitude:.4f}"
        )

        features = search_sentinel1(
            latitude,
            longitude
        )

        if not features:

            districts_without_scenes += 1

            print(
                "    No Sentinel-1 scenes found."
            )

        else:

            districts_with_scenes += 1

            print(
                f"    Scenes found: "
                f"{len(features)}"
            )

            for feature in features:

                metadata = extract_scene_metadata(
                    feature,
                    state,
                    district,
                    latitude,
                    longitude
                )

                results.append(
                    metadata
                )

        time.sleep(
            REQUEST_DELAY
        )

    # ========================================================
    # CREATE DATAFRAME
    # ========================================================

    catalog_df = pd.DataFrame(
        results
    )

    if catalog_df.empty:

        print()
        print(
            "ERROR: No Sentinel-1 scenes "
            "were found."
        )

        return

    # --------------------------------------------------------
    # Remove duplicates
    # --------------------------------------------------------

    catalog_df = catalog_df.drop_duplicates(
        subset=[
            "state",
            "district",
            "scene_id"
        ]
    )

    # --------------------------------------------------------
    # Sort
    # --------------------------------------------------------

    catalog_df = catalog_df.sort_values(
        by=[
            "state",
            "district",
            "acquisition_datetime"
        ],
        ascending=[
            True,
            True,
            False
        ]
    )

    # ========================================================
    # SAVE
    # ========================================================

    catalog_df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    # ========================================================
    # SUMMARY
    # ========================================================

    unique_districts = (
        catalog_df[
            [
                "state",
                "district"
            ]
        ]
        .drop_duplicates()
        .shape[0]
    )

    unique_scenes = (
        catalog_df[
            "scene_id"
        ]
        .nunique()
    )

    print()
    print("=" * 70)
    print("SENTINEL-1 CATALOG COMPLETE")
    print("=" * 70)

    print(
        f"\nTotal districts checked: "
        f"{total}"
    )

    print(
        f"Districts with scenes: "
        f"{districts_with_scenes}"
    )

    print(
        f"Districts without scenes: "
        f"{districts_without_scenes}"
    )

    print(
        f"Districts represented in catalog: "
        f"{unique_districts}"
    )

    print(
        f"Total unique scenes: "
        f"{unique_scenes}"
    )

    print(
        f"Catalog rows: "
        f"{len(catalog_df)}"
    )

    print()
    print(
        "Output:"
    )

    print(
        os.path.abspath(
            OUTPUT_FILE
        )
    )

    print()
    print(
        "Sample:"
    )

    display_columns = [
        "state",
        "district",
        "scene_id",
        "acquisition_datetime",
        "platform",
        "instrument_mode",
        "polarization",
    ]

    print(
        catalog_df[
            display_columns
        ]
        .head(20)
        .to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("COMPLETE")
    print("=" * 70)


# ============================================================
# START
# ============================================================

if __name__ == "__main__":

    build_catalog()