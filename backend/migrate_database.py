import sqlite3
import os


# ============================================================
# DATABASE PATH
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "disaster.db")


# ============================================================
# MIGRATIONS
# Existing database/data ko delete nahi karna
# ============================================================

MIGRATIONS = {
    "sos_requests": {
        "assigned_unit_id": "INTEGER",
        "assigned_team_id": "INTEGER",
    },

    "response_teams": {
        "assigned_sos_id": "INTEGER",
    },

    "response_units": {
        "assigned_sos_id": "INTEGER",
    },
}


def get_existing_columns(cursor, table_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    return {
        row[1]
        for row in cursor.fetchall()
    }


def migrate():
    print("=" * 70)
    print("DATABASE MIGRATION")
    print("=" * 70)

    print(f"\nDatabase:")
    print(DATABASE_PATH)

    if not os.path.exists(DATABASE_PATH):
        print("\n❌ Database file not found!")
        return

    connection = sqlite3.connect(DATABASE_PATH)
    cursor = connection.cursor()

    try:
        for table_name, columns in MIGRATIONS.items():

            print(f"\nChecking table: {table_name}")

            existing_columns = get_existing_columns(
                cursor,
                table_name
            )

            if not existing_columns:
                print("⚠️ Table does not exist. Skipping.")
                continue

            for column_name, column_type in columns.items():

                if column_name in existing_columns:
                    print(
                        f"✅ {column_name} already exists"
                    )
                    continue

                sql = (
                    f"ALTER TABLE {table_name} "
                    f"ADD COLUMN {column_name} {column_type}"
                )

                print(
                    f"➕ Adding {table_name}.{column_name}"
                )

                cursor.execute(sql)

                print("   ✅ Added")

        connection.commit()

        print("\n" + "=" * 70)
        print("✅ DATABASE MIGRATION COMPLETED")
        print("=" * 70)

    except Exception as error:

        connection.rollback()

        print("\n" + "=" * 70)
        print("❌ MIGRATION FAILED")
        print("=" * 70)

        print(error)

        raise

    finally:
        connection.close()


if __name__ == "__main__":
    migrate()