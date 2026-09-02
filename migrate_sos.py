import sqlite3
from pathlib import Path


# ============================================================
# CONFIGURATION
# ============================================================

DB_PATH = Path(__file__).resolve().parent / "backend" / "disaster.db"


# ============================================================
# MIGRATION
# ============================================================

def main():

    print("=" * 60)
    print("SOS DATABASE MIGRATION")
    print("=" * 60)

    print(f"\nDatabase:")
    print(DB_PATH)

    # --------------------------------------------------------
    # CHECK DATABASE
    # --------------------------------------------------------

    if not DB_PATH.exists():
        print("\nERROR: Database file does not exist.")
        return

    print(f"Size: {DB_PATH.stat().st_size} bytes")

    # --------------------------------------------------------
    # CONNECT
    # --------------------------------------------------------

    print("\nConnecting to SQLite database...")

    connection = sqlite3.connect(
        str(DB_PATH),
        timeout=10
    )

    print("Database connection successful.")

    try:

        # ----------------------------------------------------
        # CHECK TABLES
        # ----------------------------------------------------

        print("\nChecking sos_requests table...")

        tables = connection.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            """
        ).fetchall()

        table_names = [
            row[0]
            for row in tables
        ]

        print("Tables found:")

        for table_name in table_names:
            print(f"  - {table_name}")

        if "sos_requests" not in table_names:

            print(
                "\nERROR: sos_requests table does not exist."
            )

            return

        print(
            "\nSUCCESS: sos_requests table found."
        )

        # ----------------------------------------------------
        # READ EXISTING COLUMNS
        # ----------------------------------------------------

        print("\nReading existing SOS columns...")

        columns = connection.execute(
            "PRAGMA table_info(sos_requests)"
        ).fetchall()

        existing_columns = {
            column[1]
            for column in columns
        }

        print("\nExisting columns:")

        for column in columns:
            print(
                f"  {column[0]}: "
                f"{column[1]} | "
                f"{column[2]}"
            )

        # ----------------------------------------------------
        # MIGRATION FUNCTION
        # ----------------------------------------------------

        def add_column(
            column_name,
            column_definition
        ):

            if column_name in existing_columns:

                print(
                    f"\n  [EXISTS] {column_name}"
                )

                return

            print(
                f"\n  [ADDING] {column_name}"
            )

            sql = (
                "ALTER TABLE sos_requests "
                f"ADD COLUMN {column_name} "
                f"{column_definition}"
            )

            connection.execute(sql)

            print(
                f"  [ADDED] {column_name}"
            )

        # ----------------------------------------------------
        # ADD PHONE
        # ----------------------------------------------------

        add_column(
            "phone",
            "VARCHAR"
        )

        # ----------------------------------------------------
        # ADD DESCRIPTION
        # ----------------------------------------------------

        add_column(
            "description",
            "VARCHAR"
        )

        # ----------------------------------------------------
        # ADD STATUS
        # ----------------------------------------------------

        add_column(
            "status",
            "VARCHAR DEFAULT 'PENDING'"
        )

        # ----------------------------------------------------
        # ADD CREATED AT
        # ----------------------------------------------------

        add_column(
            "created_at",
            "DATETIME"
        )

        # ----------------------------------------------------
        # COMMIT
        # ----------------------------------------------------

        print("\nSaving migration...")

        connection.commit()

        print(
            "Migration saved successfully."
        )

        # ----------------------------------------------------
        # UPDATE EXISTING ROWS
        # ----------------------------------------------------

        print(
            "\nUpdating existing SOS records..."
        )

        connection.execute(
            """
            UPDATE sos_requests
            SET status = 'PENDING'
            WHERE status IS NULL
            """
        )

        connection.execute(
            """
            UPDATE sos_requests
            SET created_at = CURRENT_TIMESTAMP
            WHERE created_at IS NULL
            """
        )

        connection.commit()

        print(
            "Existing SOS records preserved and updated."
        )

        # ----------------------------------------------------
        # FINAL VERIFICATION
        # ----------------------------------------------------

        print("\n" + "=" * 60)
        print("FINAL SOS TABLE STRUCTURE")
        print("=" * 60)

        final_columns = connection.execute(
            "PRAGMA table_info(sos_requests)"
        ).fetchall()

        for column in final_columns:

            cid = column[0]
            name = column[1]
            data_type = column[2]
            default_value = column[4]

            print(
                f"{cid}: "
                f"{name} | "
                f"{data_type} | "
                f"DEFAULT={default_value}"
            )

        # ----------------------------------------------------
        # RECORD COUNT
        # ----------------------------------------------------

        count = connection.execute(
            "SELECT COUNT(*) FROM sos_requests"
        ).fetchone()[0]

        print("\n" + "=" * 60)
        print("SOS RECORD COUNT")
        print("=" * 60)

        print(
            f"Existing SOS records: {count}"
        )

        print("\n" + "=" * 60)
        print("SOS MIGRATION COMPLETE")
        print("=" * 60)

    except Exception as error:

        print("\n" + "=" * 60)
        print("MIGRATION ERROR")
        print("=" * 60)

        print(
            type(error).__name__
        )

        print(
            str(error)
        )

        connection.rollback()

    finally:

        connection.close()

        print(
            "\nDatabase connection closed."
        )


# ============================================================
# START
# ============================================================

if __name__ == "__main__":
    main()