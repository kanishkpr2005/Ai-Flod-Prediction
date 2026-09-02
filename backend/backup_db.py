import sqlite3
import shutil
from datetime import datetime

source = "disaster.db"

backup_name = f"disaster_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"

shutil.copy2(source, backup_name)

print("Backup created successfully!")
print("Backup file:", backup_name)