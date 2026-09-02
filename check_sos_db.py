import sqlite3
from pathlib import Path

DB_PATH = Path("backend") / "disaster.db"

print("=" * 60)
print("SOS DATABASE CHECK")
print("=" * 60)

print(f"\nDatabase: {DB_PATH.resolve()}")
print(f"Exists: {DB_PATH.exists()}")

if not DB_PATH.exists():
    print("\nERROR: Database file not found.")
    raise SystemExit(1)

print(f"Size: {DB_PATH.stat().st_size} bytes")

db = sqlite3.connect(DB_PATH)

try:
    print("\n" + "=" * 60)
    print("TABLES")
    print("=" * 60)

    tables = db.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name
        """
    ).fetchall()

    if not tables:
        print("No tables found.")
    else:
        for table in tables:
            print(f"- {table[0]}")

    print("\n" + "=" * 60)
    print("SOS REQUESTS COLUMNS")
    print("=" * 60)

    sos_table = db.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        AND name = 'sos_requests'
        """
    ).fetchone()

    if sos_table is None:
        print("ERROR: sos_requests table does NOT exist.")
    else:
        columns = db.execute(
            "PRAGMA table_info(sos_requests)"
        ).fetchall()

        for column in columns:
            cid, name, data_type, not_null, default_value, primary_key = column

            print(
                f"{cid}: "
                f"{name} | "
                f"{data_type} | "
                f"NOT NULL={not_null} | "
                f"DEFAULT={default_value} | "
                f"PK={primary_key}"
            )

        print("\n" + "=" * 60)
        print("EXISTING SOS RECORDS")
        print("=" * 60)

        rows = db.execute(
            """
            SELECT *
            FROM sos_requests
            ORDER BY id DESC
            LIMIT 10
            """
        ).fetchall()

        print(f"Records found: {len(rows)}")

        for row in rows:
            print(row)

finally:
    db.close()

print("\n" + "=" * 60)
print("CHECK COMPLETE")
print("=" * 60)