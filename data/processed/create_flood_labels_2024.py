import pandas as pd
import os

INPUT_FILE = r"data\processed\rainfall_features_2024.csv"
OUTPUT_FILE = r"data\processed\flood_training_2024.csv"

# ============================================================
# DISTRICT-LEVEL FLOOD EVENTS
# ============================================================
#
# IMPORTANT:
# The rainfall dataset uses older district/state names.
# Therefore labels below use the EXACT names present
# in district_rainfall_2024.csv.
#
# These are prototype documented-event labels.
# ============================================================

FLOOD_EVENTS = [

    # =========================
    # ASSAM
    # =========================

    ("Assam", "Lakhimpur", "2024-06-01", "2024-07-31"),
    ("Assam", "Dhemaji", "2024-06-01", "2024-07-31"),
    ("Assam", "Dibrugarh", "2024-06-01", "2024-07-31"),
    ("Assam", "Tinsukia", "2024-06-01", "2024-07-31"),
    ("Assam", "Sibsagar", "2024-06-01", "2024-07-31"),
    ("Assam", "Jorhat", "2024-06-01", "2024-07-31"),
    ("Assam", "Golaghat", "2024-06-01", "2024-07-31"),
    ("Assam", "Sonitpur", "2024-06-01", "2024-07-31"),
    ("Assam", "Nagaon", "2024-06-01", "2024-07-31"),
    ("Assam", "Darrang", "2024-06-01", "2024-07-31"),
    ("Assam", "Barpeta", "2024-06-01", "2024-07-31"),
    ("Assam", "Kamrup", "2024-06-01", "2024-07-31"),

    # =========================
    # BIHAR
    # =========================

    ("Bihar", "Purba Champaran", "2024-08-01", "2024-08-31"),
    ("Bihar", "Pashchim Champaran", "2024-08-01", "2024-08-31"),
    ("Bihar", "Gopalganj", "2024-08-01", "2024-08-31"),
    ("Bihar", "Sitamarhi", "2024-08-01", "2024-08-31"),
    ("Bihar", "Sheohar", "2024-08-01", "2024-08-31"),
    ("Bihar", "Muzaffarpur", "2024-08-01", "2024-08-31"),
    ("Bihar", "Darbhanga", "2024-08-01", "2024-08-31"),
    ("Bihar", "Madhubani", "2024-08-01", "2024-08-31"),
    ("Bihar", "Supaul", "2024-08-01", "2024-08-31"),
    ("Bihar", "Saharsa", "2024-08-01", "2024-08-31"),
    ("Bihar", "Madhepura", "2024-08-01", "2024-08-31"),
    ("Bihar", "Khagaria", "2024-08-01", "2024-08-31"),
    ("Bihar", "Samastipur", "2024-08-01", "2024-08-31"),
    ("Bihar", "Begusarai", "2024-08-01", "2024-08-31"),
    ("Bihar", "Katihar", "2024-08-01", "2024-08-31"),
    ("Bihar", "Purnia", "2024-08-01", "2024-08-31"),
    ("Bihar", "Araria", "2024-08-01", "2024-08-31"),
    ("Bihar", "Kishanganj", "2024-08-01", "2024-08-31"),

    # =========================
    # ANDHRA PRADESH
    # =========================
    #
    # Dataset contains old Andhra Pradesh boundaries.
    # Therefore use districts under Andhra Pradesh.
    #

    ("Andhra Pradesh", "Guntur", "2024-09-01", "2024-09-18"),
    ("Andhra Pradesh", "Krishna", "2024-09-01", "2024-09-18"),
    ("Andhra Pradesh", "Khammam", "2024-09-01", "2024-09-18"),
    ("Andhra Pradesh", "Warangal", "2024-09-01", "2024-09-18"),

    # =========================
    # ODISHA
    # =========================
    #
    # Dataset calls Odisha "Orissa".
    #

    ("Orissa", "Balasore", "2024-07-01", "2024-08-31"),
    ("Orissa", "Bhadrak", "2024-07-01", "2024-08-31"),
    ("Orissa", "Jajpur", "2024-07-01", "2024-08-31"),
    ("Orissa", "Kendrapara", "2024-07-01", "2024-08-31"),
    ("Orissa", "Cuttack", "2024-07-01", "2024-08-31"),
    ("Orissa", "Jagatsinghpur", "2024-07-01", "2024-08-31"),

    # =========================
    # UTTAR PRADESH
    # =========================

    ("Uttar Pradesh", "Lakhimpur Kheri", "2024-07-01", "2024-09-30"),
    ("Uttar Pradesh", "Bahraich", "2024-07-01", "2024-09-30"),
    ("Uttar Pradesh", "Shravasti", "2024-07-01", "2024-09-30"),
    ("Uttar Pradesh", "Gonda", "2024-07-01", "2024-09-30"),
    ("Uttar Pradesh", "Bara Banki", "2024-07-01", "2024-09-30"),
    ("Uttar Pradesh", "Ballia", "2024-07-01", "2024-09-30"),
    ("Uttar Pradesh", "Varanasi", "2024-07-01", "2024-09-30"),
]


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("CREATING DISTRICT-LEVEL FLOOD LABELS")
print("=" * 70)

df = pd.read_csv(INPUT_FILE)

df["date"] = pd.to_datetime(df["date"])

print(f"\nInput rows: {len(df):,}")
print(f"Districts: {df['district'].nunique()}")
print(f"States: {df['state'].nunique()}")


# ============================================================
# NORMALIZE KEYS
# ============================================================

df["state_key"] = (
    df["state"]
    .astype(str)
    .str.strip()
    .str.lower()
)

df["district_key"] = (
    df["district"]
    .astype(str)
    .str.strip()
    .str.lower()
)


# ============================================================
# INITIAL LABEL
# ============================================================

df["flood"] = 0


# ============================================================
# APPLY EVENTS
# ============================================================

warnings = 0
matched_events = 0

for state, district, start, end in FLOOD_EVENTS:

    state_key = state.strip().lower()
    district_key = district.strip().lower()

    start_date = pd.to_datetime(start)
    end_date = pd.to_datetime(end)

    mask = (
        (df["state_key"] == state_key)
        &
        (df["district_key"] == district_key)
        &
        (df["date"] >= start_date)
        &
        (df["date"] <= end_date)
    )

    matched = int(mask.sum())

    if matched == 0:
        print(
            f"WARNING: No match -> "
            f"{state} / {district}"
        )
        warnings += 1
    else:
        df.loc[mask, "flood"] = 1
        matched_events += 1


# ============================================================
# REMOVE TEMP COLUMNS
# ============================================================

df.drop(
    columns=["state_key", "district_key"],
    inplace=True
)


# ============================================================
# SAVE
# ============================================================

os.makedirs(
    os.path.dirname(OUTPUT_FILE),
    exist_ok=True
)

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# REPORT
# ============================================================

print("\n" + "=" * 70)
print("FLOOD DATASET CREATED")
print("=" * 70)

print(f"\nTotal rows: {len(df):,}")

print(
    f"Flood-labelled rows: "
    f"{int(df['flood'].sum()):,}"
)

print(
    f"Non-flood rows: "
    f"{int((df['flood'] == 0).sum()):,}"
)

print(f"\nMatched events: {matched_events}")
print(f"Unmatched events: {warnings}")

print("\nClass distribution:")
print(df["flood"].value_counts())

print("\nFlood-labelled districts:")

print(
    df.loc[
        df["flood"] == 1,
        ["state", "district"]
    ]
    .drop_duplicates()
    .sort_values(["state", "district"])
    .to_string(index=False)
)

print("\nOutput:")
print(os.path.abspath(OUTPUT_FILE))

print("\n" + "=" * 70)