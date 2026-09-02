import os
import time
import getpass
import requests
import pandas as pd


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

DOWNLOAD_LIST = os.path.join(
    BASE_DIR,
    "data",
    "satellite",
    "processed",
    "sentinel1_download_list.csv"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "data",
    "satellite",
    "raw"
)

AUTH_URL = (
    "https://identity.dataspace.copernicus.eu/"
    "auth/realms/CDSE/protocol/openid-connect/token"
)

CATALOGUE_URL = (
    "https://catalogue.dataspace.copernicus.eu/"
    "odata/v1/Products"
)

DOWNLOAD_URL = (
    "https://download.dataspace.copernicus.eu/"
    "odata/v1/Products"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)

TIMEOUT = 180
MAX_DOWNLOADS = 50


def authenticate():

    print()
    print("=" * 70)
    print("AUTHENTICATING WITH COPERNICUS DATA SPACE")
    print("=" * 70)

    username = input("Copernicus username/email: ")
    password = getpass.getpass("Copernicus password: ")

    data = {
        "client_id": "cdse-public",
        "username": username,
        "password": password,
        "grant_type": "password",
    }

    response = requests.post(
        AUTH_URL,
        data=data,
        timeout=60
    )

    print(
        f"Token HTTP status: {response.status_code}"
    )

    if response.status_code != 200:
        print(response.text[:1000])
        raise RuntimeError("Copernicus authentication failed.")

    token = response.json()["access_token"]

    print("Copernicus authentication: SUCCESS")

    return token


def find_product(scene_id):

    # Catalog product names are usually .SAFE
    possible_names = [
        scene_id,
        scene_id + ".SAFE"
    ]

    for name in possible_names:

        params = {
            "$filter": f"Name eq '{name}'",
            "$top": 5
        }

        response = requests.get(
            CATALOGUE_URL,
            params=params,
            timeout=60
        )

        if response.status_code != 200:
            print(
                f"    Catalogue HTTP: "
                f"{response.status_code}"
            )
            continue

        data = response.json()

        products = data.get(
            "value",
            []
        )

        if products:

            product = products[0]

            return (
                product.get("Id"),
                product.get("Name"),
                product.get("ContentLength")
            )

    return None, None, None


def download_product(
    token,
    product_id,
    output_path
):

    url = (
        f"{DOWNLOAD_URL}"
        f"({product_id})"
        f"/$value"
    )

    headers = {
        "Authorization": f"Bearer {token}"
    }

    temp_path = output_path + ".part"

    print()
    print("    Download URL:")
    print(f"    {url}")

    try:

        with requests.get(
            url,
            headers=headers,
            stream=True,
            allow_redirects=True,
            timeout=TIMEOUT
        ) as response:

            print(
                f"    Download HTTP: "
                f"{response.status_code}"
            )

            if response.status_code != 200:

                print(
                    response.text[:500]
                )

                return False

            total = int(
                response.headers.get(
                    "Content-Length",
                    0
                )
            )

            downloaded = 0

            with open(
                temp_path,
                "wb"
            ) as f:

                for chunk in response.iter_content(
                    chunk_size=1024 * 1024
                ):

                    if not chunk:
                        continue

                    f.write(chunk)

                    downloaded += len(chunk)

                    if total:

                        percent = (
                            downloaded / total
                        ) * 100

                        print(
                            f"\r    Progress: "
                            f"{percent:.1f}% "
                            f"({downloaded / 1024 / 1024:.1f} MB / "
                            f"{total / 1024 / 1024:.1f} MB)",
                            end=""
                        )

                    else:

                        print(
                            f"\r    Downloaded: "
                            f"{downloaded / 1024 / 1024:.1f} MB",
                            end=""
                        )

            print()

        if not os.path.exists(temp_path):
            return False

        size = os.path.getsize(temp_path)

        if size == 0:
            os.remove(temp_path)
            return False

        os.replace(
            temp_path,
            output_path
        )

        print(
            f"    SAVED: "
            f"{size / 1024 / 1024:.2f} MB"
        )

        return True

    except Exception as e:

        print()
        print(
            f"    Download error: {e}"
        )

        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

        return False


def main():

    print()
    print("=" * 70)
    print("SENTINEL-1 AUTHENTICATED DOWNLOADER")
    print("=" * 70)

    if not os.path.exists(DOWNLOAD_LIST):

        raise FileNotFoundError(
            DOWNLOAD_LIST
        )

    df = pd.read_csv(
        DOWNLOAD_LIST
    )

    print(
        f"\nDownload list rows: {len(df)}"
    )

    df = df.head(
        MAX_DOWNLOADS
    ).copy()

    token = authenticate()

    print()
    print(
        f"Scenes selected: {len(df)}"
    )

    successful = 0
    failed = 0

    for position, (_, row) in enumerate(
        df.iterrows(),
        start=1
    ):

        state = str(
            row["state"]
        ).strip()

        district = str(
            row["district"]
        ).strip()

        scene_id = str(
            row["scene_id"]
        ).strip()

        print()
        print("=" * 70)

        print(
            f"[{position}/{len(df)}] "
            f"{district}, {state}"
        )

        print(
            f"Scene: {scene_id}"
        )

        print()
        print(
            "    Searching current CDSE catalogue..."
        )

        product_id, product_name, content_length = (
            find_product(scene_id)
        )

        if not product_id:

            print(
                "    FAILED: Product not found."
            )

            failed += 1
            continue

        print(
            f"    Product ID: {product_id}"
        )

        print(
            f"    Product name: {product_name}"
        )

        if content_length:

            print(
                f"    Size: "
                f"{content_length / 1024 / 1024:.2f} MB"
            )

        district_folder = os.path.join(
            OUTPUT_DIR,
            state,
            district
        )

        os.makedirs(
            district_folder,
            exist_ok=True
        )

        output_file = os.path.join(
            district_folder,
            f"{scene_id}.zip"
        )

        if os.path.exists(output_file):

            size = os.path.getsize(
                output_file
            )

            if size > 0:

                print(
                    f"    Already downloaded: "
                    f"{size / 1024 / 1024:.2f} MB"
                )

                successful += 1
                continue

        print()
        print(
            "    Starting authenticated download..."
        )

        ok = download_product(
            token,
            product_id,
            output_file
        )

        if ok:
            successful += 1
        else:
            failed += 1

        time.sleep(1)

    print()
    print("=" * 70)
    print("SENTINEL-1 DOWNLOAD COMPLETE")
    print("=" * 70)

    print(
        f"\nScenes processed: {len(df)}"
    )

    print(
        f"Successful: {successful}"
    )

    print(
        f"Failed: {failed}"
    )

    print()
    print(
        "Output:"
    )

    print(
        os.path.abspath(
            OUTPUT_DIR
        )
    )

    print()
    print("=" * 70)


if __name__ == "__main__":
    main()