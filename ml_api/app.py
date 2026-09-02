from flask import Flask, request, jsonify
import joblib
import pandas as pd
import os


# ============================================================
# APP SETUP
# ============================================================

app = Flask(__name__)


# ============================================================
# MODEL PATH
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "flood_random_forest.pkl"
)


# ============================================================
# LOAD MODEL
# ============================================================

try:

    model = joblib.load(MODEL_PATH)

    print("=" * 60)
    print(" FLOOD ML API")
    print("=" * 60)
    print("✅ Random Forest model loaded")
    print("Model:", MODEL_PATH)

except Exception as e:

    print("❌ Could not load model")
    print(e)

    model = None


# ============================================================
# FEATURES
# ============================================================

FEATURES = [

    "rainfall_mean_mm",
    "rainfall_max_mm",
    "rainfall_total_mm",
    "heavy_rain_pixels",
    "extreme_rain_pixels",

    "rainfall_3day_mm",
    "rainfall_7day_mm",
    "rainfall_14day_mm",

    "max_rainfall_3day_mm",
    "max_rainfall_7day_mm",

    "heavy_rain_pixels_3day",
    "heavy_rain_pixels_7day",

    "extreme_rain_pixels_3day",
    "extreme_rain_pixels_7day",

]


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "status": "online",
        "service": "AI Flood Risk Prediction API",
        "model": "Random Forest",
        "model_loaded": model is not None
    })


# ============================================================
# FLOOD PREDICTION
# ============================================================

@app.route(
    "/predict-flood",
    methods=["POST"]
)
def predict_flood():

    try:

        # ----------------------------------------------------
        # Check model
        # ----------------------------------------------------

        if model is None:

            return jsonify({
                "success": False,
                "error": "ML model is not loaded"
            }), 500


        # ----------------------------------------------------
        # Read JSON
        # ----------------------------------------------------

        data = request.get_json()

        if not data:

            return jsonify({
                "success": False,
                "error": "Request body is empty"
            }), 400


        # ----------------------------------------------------
        # Check required features
        # ----------------------------------------------------

        missing_features = [

            feature

            for feature in FEATURES

            if feature not in data

        ]

        if missing_features:

            return jsonify({

                "success": False,

                "error": "Missing required features",

                "missing_features":
                    missing_features

            }), 400


        # ----------------------------------------------------
        # Create dataframe
        # ----------------------------------------------------

        input_data = {

            feature: [
                float(data[feature])
            ]

            for feature in FEATURES

        }


        df = pd.DataFrame(
            input_data
        )


        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        prediction = int(
            model.predict(df)[0]
        )


        probability = float(
            model.predict_proba(df)[0][1]
        )


        # ----------------------------------------------------
        # Risk level
        # ----------------------------------------------------

        if probability < 0.30:

            risk_level = "LOW"

        elif probability < 0.60:

            risk_level = "MODERATE"

        else:

            risk_level = "HIGH"


        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "prediction":
                prediction,

            "flood_probability":
                round(
                    probability * 100,
                    2
                ),

            "risk_level":
                risk_level,

            "model":
                "Random Forest"

        })


    except Exception as e:

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )