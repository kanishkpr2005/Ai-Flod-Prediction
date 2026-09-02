from database import SessionLocal
from models import Alert


FIXES = {
    "Panch Mahals": (22.6978099, 73.5980682),
    "Pashchim Singhbhum": (22.558, 85.788),
    "North Cachar Hills": (24.75864, 92.8816648),
}


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

    print("=" * 70)
    print("FIXING REMAINING FLOOD ALERT COORDINATES")
    print("=" * 70)

    updated = 0

    for alert in alerts:

        if alert.location not in FIXES:
            continue

        if alert.latitude is not None and alert.longitude is not None:
            print(
                f"[SKIP] {alert.location} already has coordinates"
            )
            continue

        latitude, longitude = FIXES[alert.location]

        alert.latitude = latitude
        alert.longitude = longitude

        updated += 1

        print(
            f"[UPDATED] {alert.location} -> "
            f"{latitude}, {longitude}"
        )

    db.commit()

    print()
    print("=" * 70)
    print("UPDATE COMPLETE")
    print("=" * 70)
    print(f"Total updated: {updated}")

finally:
    db.close()