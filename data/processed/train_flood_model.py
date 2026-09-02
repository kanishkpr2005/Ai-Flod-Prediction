import os
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)


# ============================================================
# SETTINGS
# ============================================================

INPUT_FILE = r"data\processed\flood_training_2024.csv"

MODEL_DIR = "models"

MODEL_FILE = r"models\flood_random_forest.pkl"


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("FLOOD RISK MODEL TRAINING")
print("=" * 70)

print("\nLoading dataset...")

df = pd.read_csv(INPUT_FILE)

df["date"] = pd.to_datetime(df["date"])

df = df.sort_values(
    ["date", "state", "district"]
).reset_index(drop=True)


print(f"\nTotal rows: {len(df):,}")
print(f"Districts: {df['district'].nunique()}")
print(f"States: {df['state'].nunique()}")
print(f"Dates: {df['date'].nunique()}")


# ============================================================
# CLASS DISTRIBUTION
# ============================================================

print("\nClass distribution:")

print(
    df["flood"].value_counts()
)


# ============================================================
# FEATURES
# ============================================================

FEATURES = [

    # Current rainfall
    "rainfall_total_mm",
    "rainfall_1d",
    "heavy_rain_pixels",
    "extreme_rain_pixels",

    # Cumulative rainfall
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_14d",
    "rainfall_30d",

    # Maximum rainfall
    "max_rainfall_3d",
    "max_rainfall_7d",
    "max_rainfall_14d",
    "max_rainfall_30d",

    # Heavy rainfall activity
    "heavy_rain_3d",
    "heavy_rain_7d",
    "heavy_rain_14d",
    "heavy_rain_30d",

    # Extreme rainfall activity
    "extreme_rain_3d",
    "extreme_rain_7d",
    "extreme_rain_14d",
    "extreme_rain_30d",

    # Rainfall trend
    "rainfall_previous_day",
    "rainfall_change",
    "rainfall_change_pct",
]


# ============================================================
# CHECK FEATURES
# ============================================================

print("\nChecking ML features...")

missing_features = [
    feature
    for feature in FEATURES
    if feature not in df.columns
]

if missing_features:

    print("\nERROR: Missing features:")

    for feature in missing_features:
        print(" -", feature)

    raise ValueError(
        "Required ML features are missing."
    )


print("All ML features found.")


# ============================================================
# PREPARE X AND Y
# ============================================================

X = df[FEATURES].copy()

y = df["flood"].astype(int)


# ============================================================
# CLEAN DATA
# ============================================================

print("\nCleaning feature values...")

X = X.replace(
    [float("inf"), float("-inf")],
    pd.NA
)

X = X.fillna(0)


# ============================================================
# TIME-BASED TRAIN / TEST SPLIT
# ============================================================

print("\nCreating chronological train/test split...")

# ------------------------------------------------------------
# TRAIN:
# 2024-01-01 → 2024-08-31
#
# TEST:
# 2024-09-01 → 2024-12-31
# ------------------------------------------------------------

split_date = pd.Timestamp("2024-09-01")


train_mask = (
    df["date"] < split_date
)

test_mask = (
    df["date"] >= split_date
)


X_train = X.loc[train_mask]

X_test = X.loc[test_mask]

y_train = y.loc[train_mask]

y_test = y.loc[test_mask]


# ============================================================
# SPLIT INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("TRAIN / TEST SPLIT")
print("=" * 70)

print(
    "\nTraining period:"
)

print(
    df.loc[train_mask, "date"].min(),
    "to",
    df.loc[train_mask, "date"].max()
)

print(
    "\nTesting period:"
)

print(
    df.loc[test_mask, "date"].min(),
    "to",
    df.loc[test_mask, "date"].max()
)


print("\nTraining rows:", f"{len(X_train):,}")

print(
    "Training flood labels:",
    int(y_train.sum())
)


print("\nTesting rows:", f"{len(X_test):,}")

print(
    "Testing flood labels:",
    int(y_test.sum())
)


# ============================================================
# SAFETY CHECK
# ============================================================

if y_train.nunique() < 2:

    raise ValueError(
        "Training dataset contains only one class."
    )


if y_test.nunique() < 2:

    raise ValueError(
        "Testing dataset contains only one class."
    )


# ============================================================
# RANDOM FOREST MODEL
# ============================================================

print("\n" + "=" * 70)
print("TRAINING RANDOM FOREST")
print("=" * 70)


model = RandomForestClassifier(

    n_estimators=400,

    max_depth=10,

    min_samples_leaf=3,

    class_weight="balanced",

    random_state=42,

    n_jobs=-1
)


print("\nStarting training...")

model.fit(
    X_train,
    y_train
)

print("Training complete.")


# ============================================================
# PREDICTIONS
# ============================================================

print("\nGenerating predictions...")

y_pred = model.predict(
    X_test
)

y_probability = model.predict_proba(
    X_test
)[:, 1]


# ============================================================
# EVALUATION
# ============================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

auc = roc_auc_score(
    y_test,
    y_probability
)


print("\n" + "=" * 70)
print("MODEL EVALUATION")
print("=" * 70)


print(
    f"\nAccuracy : {accuracy:.4f}"
)

print(
    f"ROC-AUC  : {auc:.4f}"
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\nConfusion Matrix:")

cm = confusion_matrix(
    y_test,
    y_pred
)

print(cm)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

importance = pd.DataFrame({

    "feature": FEATURES,

    "importance":
        model.feature_importances_

})


importance = importance.sort_values(
    "importance",
    ascending=False
)


print("\n" + "=" * 70)
print("FEATURE IMPORTANCE")
print("=" * 70)

print(
    importance.to_string(
        index=False
    )
)


# ============================================================
# SAVE FEATURE IMPORTANCE
# ============================================================

importance_file = (
    "data/processed/"
    "flood_feature_importance_2024.csv"
)


importance.to_csv(
    importance_file,
    index=False
)


# ============================================================
# SAVE MODEL
# ============================================================

print("\nSaving model...")

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


joblib.dump(
    model,
    MODEL_FILE
)


print("\n" + "=" * 70)
print("MODEL SAVED SUCCESSFULLY")
print("=" * 70)

print(
    "\nModel:"
)

print(
    os.path.abspath(
        MODEL_FILE
    )
)

print(
    "\nFeature importance:"
)

print(
    os.path.abspath(
        importance_file
    )
)

print("\n" + "=" * 70)