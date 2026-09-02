import glob
import os
import re
import datetime

files = glob.glob("data/raw/rainfall/*.nc4")

downloaded = set()

for file in files:
    name = os.path.basename(file)

    match = re.search(
        r"IMERG\.(\d{8})-",
        name
    )

    if match:
        downloaded.add(match.group(1))


start = datetime.date(2024, 1, 1)
end = datetime.date(2024, 12, 31)

missing = []

current = start

while current <= end:

    date_str = current.strftime("%Y%m%d")

    if date_str not in downloaded:
        missing.append(date_str)

    current += datetime.timedelta(days=1)


print("=" * 50)
print("MISSING IMERG DATES")
print("=" * 50)

print("Downloaded:", len(downloaded))
print("Missing:", len(missing))

print()

for date in missing:
    print(date)

print("=" * 50)