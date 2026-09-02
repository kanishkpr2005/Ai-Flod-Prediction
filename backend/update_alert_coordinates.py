import csv
from pathlib import Path

from database import SessionLocal
from models import Alert


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

LOCATION_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "district_locations.csv"
)


# ============================================================
# LOAD DISTRICT COORDINATES
# ============================================================

def load_coordinates():

    coordinates = {}

    with open(
        LOCATION_FILE,
        "r",
        encoding="utf-8-sig",
        newline=""
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:

            state = (
                row.get("state")
                or ""
            ).strip()

            district = (
                row.get("district")
                or ""
            ).strip()

            latitude = row.get("latitude")
            longitude = row.get("longitude")

            if not district:
                continue

            if not latitude or not longitude:
                continue

            try:

                latitude = float(latitude)
                longitude = float(longitude)

            except ValueError:

                continue

            # Primary key:
            # district name
            coordinates[
                district.lower()
            ] = {
                "state": state,
                "latitude": latitude,
                "longitude": longitude,
            }

    return coordinates


# ============================================================
# UPDATE ALERT COORDINATES
# ============================================================

def update_alert_coordinates():

    print("\n" + "=" * 70)
    print("UPDATING ACTIVE FLOOD ALERT COORDINATES")
    print("=" * 70)

    print(
        f"\nCoordinate file:\n{LOCATION_FILE}"
    )

    # --------------------------------------------------------
    # Check coordinate file
    # --------------------------------------------------------

    if not LOCATION_FILE.exists():

        print(
            "\nERROR: district_locations.csv not found."
        )

        return

    # --------------------------------------------------------
    # Load coordinates
    # --------------------------------------------------------

    coordinates = load_coordinates()

    print(
        f"\nDistrict coordinates loaded: "
        f"{len(coordinates)}"
    )

    # --------------------------------------------------------
    # Open database
    # --------------------------------------------------------

    db = SessionLocal()

    try:

        alerts = (
            db.query(Alert)
            .filter(
                Alert.status == "ACTIVE",
                Alert.disaster_type == "flood"
            )
            .all()
        )

        print(
            f"Active flood alerts found: "
            f"{len(alerts)}"
        )

        updated = 0
        already_had_coordinates = 0
        not_found = 0

        not_found_locations = []

        # ----------------------------------------------------
        # Process alerts
        # ----------------------------------------------------

        for alert in alerts:

            location = (
                alert.location
                or ""
            ).strip()

            key = location.lower()

            coordinate = coordinates.get(key)

            # ------------------------------------------------
            # Coordinate not found
            # ------------------------------------------------

            if coordinate is None:

                not_found += 1

                not_found_locations.append(
                    location
                )

                print(
                    f"[NOT FOUND] "
                    f"{location}"
                )

                continue

            # ------------------------------------------------
            # Already has coordinates
            # ------------------------------------------------

            if (
                alert.latitude is not None
                and
                alert.longitude is not None
            ):

                already_had_coordinates += 1

                print(
                    f"[EXISTS] "
                    f"{location} -> "
                    f"{alert.latitude}, "
                    f"{alert.longitude}"
                )

                continue

            # ------------------------------------------------
            # Update coordinates
            # ------------------------------------------------

            alert.latitude = coordinate[
                "latitude"
            ]

            alert.longitude = coordinate[
                "longitude"
            ]

            updated += 1

            print(
                f"[UPDATED] "
                f"{location} -> "
                f"{alert.latitude}, "
                f"{alert.longitude}"
            )

        # ----------------------------------------------------
        # Commit changes
        # ----------------------------------------------------

        if updated > 0:

            db.commit()

        # ----------------------------------------------------
        # Summary
        # ----------------------------------------------------

        print("\n" + "=" * 70)
        print("UPDATE COMPLETE")
        print("=" * 70)

        print(
            f"\nTotal active flood alerts: "
            f"{len(alerts)}"
        )

        print(
            f"Coordinates updated: "
            f"{updated}"
        )

        print(
            f"Already had coordinates: "
            f"{already_had_coordinates}"
        )

        print(
            f"Districts not found: "
            f"{not_found}"
        )

        # ----------------------------------------------------
        # Show unmatched locations
        # ----------------------------------------------------

        if not_found_locations:

            print(
                "\nLocations not found:"
            )

            for location in not_found_locations:

                print(
                    f"  - {location}"
                )

        print("\n" + "=" * 70)

    except Exception as error:

        db.rollback()

        print(
            "\nERROR:"
        )

        print(
            str(error)
        )

        raise

    finally:

        db.close()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    update_alert_coordinates()