import sqlite3
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "disaster.db"


def migrate_alerts():
    print("Starting alerts table migration...")

    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    # Check existing columns
    cursor.execute("PRAGMA table_info(alerts)")

    existing_columns = {
        row[1]
        for row in cursor.fetchall()
    }

    print("\nExisting columns:")
    print(existing_columns)

    # Add status
    if "status" not in existing_columns:
        cursor.execute(
            """
            ALTER TABLE alerts
            ADD COLUMN status TEXT DEFAULT 'ACTIVE'
            """
        )
        print("Added: status")
    else:
        print("Already exists: status")

    # Add created_at
    if "created_at" not in existing_columns:
        cursor.execute(
            """
            ALTER TABLE alerts
            ADD COLUMN created_at DATETIME
            """
        )
        print("Added: created_at")
    else:
        print("Already exists: created_at")

    # Add expires_at
    if "expires_at" not in existing_columns:
        cursor.execute(
            """
            ALTER TABLE alerts
            ADD COLUMN expires_at DATETIME
            """
        )
        print("Added: expires_at")
    else:
        print("Already exists: expires_at")

    # Add disaster_type
    if "disaster_type" not in existing_columns:
        cursor.execute(
            """
            ALTER TABLE alerts
            ADD COLUMN disaster_type TEXT
            """
        )
        print("Added: disaster_type")
    else:
        print("Already exists: disaster_type")

    # Existing alerts ko ACTIVE karo
    cursor.execute(
        """
        UPDATE alerts
        SET status = 'ACTIVE'
        WHERE status IS NULL
        """
    )

    # Existing alerts ke liye creation time
    cursor.execute(
        """
        UPDATE alerts
        SET created_at = CURRENT_TIMESTAMP
        WHERE created_at IS NULL
        """
    )

    connection.commit()

    # Verify
    cursor.execute("PRAGMA table_info(alerts)")

    columns = cursor.fetchall()

    print("\nFinal alerts table columns:")

    for column in columns:
        print(f"- {column[1]} ({column[2]})")

    # Existing alerts
    cursor.execute(
        """
        SELECT
            id,
            title,
            location,
            severity,
            status,
            created_at,
            expires_at,
            disaster_type
        FROM alerts
        """
    )

    alerts = cursor.fetchall()

    print("\nExisting alerts after migration:")

    for alert in alerts:
        print(alert)

    connection.close()

    print("\n✅ Alerts migration completed successfully.")


if __name__ == "__main__":
    migrate_alerts()