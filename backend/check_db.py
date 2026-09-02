import os
import sqlite3


# ============================================================
# DATABASE PATH
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATABASE_PATH = os.path.join(
    BASE_DIR,
    "disaster.db"
)


print(
    f"Database:\n{DATABASE_PATH}"
)


# ============================================================
# CONNECT
# ============================================================

conn = sqlite3.connect(
    DATABASE_PATH
)

cursor = conn.cursor()


# ============================================================
# TABLES
# ============================================================

print("\nTables in database:")

cursor.execute(
    "SELECT name FROM sqlite_master "
    "WHERE type='table' "
    "ORDER BY name"
)

tables = cursor.fetchall()

for table in tables:

    print(
        f"- {table[0]}"
    )


# ============================================================
# SAFE TABLE CHECK
# ============================================================

def show_table(
    table_name
):

    print(
        f"\n{table_name}:"
    )

    existing_tables = [
        table[0]
        for table in tables
    ]

    if table_name not in existing_tables:

        print(
            "Table does not exist."
        )

        return

    cursor.execute(
        f"SELECT * FROM {table_name}"
    )

    rows = cursor.fetchall()

    for row in rows:

        print(row)

    if not rows:

        print(
            "(empty)"
        )


# ============================================================
# SHOW DATA
# ============================================================

show_table("disasters")

show_table("sos_requests")

show_table("reports")

show_table("rescue_teams")

show_table("volunteers")

show_table("alerts")


# ============================================================
# CLOSE
# ============================================================

conn.close()