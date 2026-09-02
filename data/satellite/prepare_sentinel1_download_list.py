import os
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

CATALOG_FILE = os.path.join(
    BASE_DIR,
    "data",
    "satellite",
    "processed",
    "sentinel1_catalog.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "satellite",
    "processed",
    "sentinel1_download_list.csv"
)


# ============================================================
# SETTINGS
# ============================================================

# Number of unique Sentinel-1 scenes to download initially.
# Start small so we can test the complete pipeline.
MAX_SCENES = 50


# ============================================================
# LOAD CATALOG
# ============================================================

def load_catalog():

    print()
    print("=" * 70)
    print("PREPARING SENTINEL-1 DOWNLOAD DATASET")
    print("=" * 70)

    print()
    print("Catalog:")
    print(CATALOG_FILE)

    if not os.path.exists(CATALOG_FILE):

        raise FileNotFoundError(
            f"Catalog not found:\n{CATALOG_FILE}"
        )

    df = pd.read_csv(
        CATALOG_FILE
    )

    print()
    print(
        f"Catalog rows: {len(df)}"
    )

    print(
        f"Unique scenes: "
        f"{df['scene_id'].nunique()}"
    )

    print(
        f"Districts: "
        f"{df[['state', 'district']].drop_duplicates().shape[0]}"
    )

    return df


# ============================================================
# PREPARE UNIQUE SCENES
# ============================================================

def prepare_download_list(df):

    print()
    print("=" * 70)
    print("SELECTING UNIQUE SATELLITE SCENES")
    print("=" * 70)

    # --------------------------------------------------------
    # Sort newest scenes first
    # --------------------------------------------------------

    df["acquisition_datetime"] = pd.to_datetime(
        df["acquisition_datetime"],
        errors="coerce"
    )

    df = df.sort_values(
        by="acquisition_datetime",
        ascending=False
    )

    # --------------------------------------------------------
    # Keep only unique scenes
    # --------------------------------------------------------

    unique_scenes = df.drop_duplicates(
        subset=["scene_id"],
        keep="first"
    ).copy()

    print()
    print(
        f"Unique scenes available: "
        f"{len(unique_scenes)}"
    )

    # --------------------------------------------------------
    # Select initial pilot dataset
    # --------------------------------------------------------

    selected = unique_scenes.head(
        MAX_SCENES
    ).copy()

    # --------------------------------------------------------
    # Extract useful asset URLs
    # --------------------------------------------------------

    def extract_tiff_urls(asset_urls):

        if pd.isna(asset_urls):

            return ""

        urls = str(
            asset_urls
        ).split(" | ")

        tiff_urls = [
            url
            for url in urls
            if ".tiff" in url.lower()
        ]

        return " | ".join(
            tiff_urls
        )

    selected["tiff_urls"] = (
        selected["asset_urls"]
        .apply(
            extract_tiff_urls
        )
    )

    # --------------------------------------------------------
    # Check VV/VH availability
    # --------------------------------------------------------

    selected["has_vv"] = (
        selected["tiff_urls"]
        .str.lower()
        .str.contains(
            "-vv-"
        )
    )

    selected["has_vh"] = (
        selected["tiff_urls"]
        .str.lower()
        .str.contains(
            "-vh-"
        )
    )

    # --------------------------------------------------------
    # Add download status
    # --------------------------------------------------------

    selected["download_status"] = (
        "PENDING"
    )

    # --------------------------------------------------------
    # Select final columns
    # --------------------------------------------------------

    columns = [

        "state",

        "district",

        "district_latitude",

        "district_longitude",

        "scene_id",

        "acquisition_datetime",

        "platform",

        "orbit_state",

        "instrument_mode",

        "tiff_urls",

        "has_vv",

        "has_vh",

        "download_status",

    ]

    selected = selected[
        columns
    ]

    return selected


# ============================================================
# SAVE
# ============================================================

def save_download_list(df):

    os.makedirs(
        os.path.dirname(
            OUTPUT_FILE
        ),
        exist_ok=True
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print()
    print("=" * 70)
    print("DOWNLOAD LIST CREATED")
    print("=" * 70)

    print()
    print(
        f"Selected scenes: "
        f"{len(df)}"
    )

    print(
        f"VV available: "
        f"{df['has_vv'].sum()}"
    )

    print(
        f"VH available: "
        f"{df['has_vh'].sum()}"
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

    print(
        df[
            [
                "state",
                "district",
                "scene_id",
                "acquisition_datetime",
                "has_vv",
                "has_vh",
                "download_status"
            ]
        ]
        .head(10)
        .to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("COMPLETE")
    print("=" * 70)


# ============================================================
# MAIN
# ============================================================

def main():

    catalog = load_catalog()

    download_list = prepare_download_list(
        catalog
    )

    save_download_list(
        download_list
    )


# ============================================================
# START
# ============================================================

if __name__ == "__main__":

    main()