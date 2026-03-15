"""
fetch_from_drive.py
--------------------
Downloads the latest JSON file from a Google Drive folder
(ChadshaniFactory/NewsDesk), extracts the 'content' field,
and writes it to temp_news.txt — ready for generate_website.py.

Authentication: Google Service Account (JSON key stored as GitHub Secret).

GitHub Secrets required:
  GDRIVE_SERVICE_ACCOUNT_JSON  — full contents of the service account key file
  GDRIVE_FOLDER_ID             — Google Drive folder ID for ChadshaniFactory/NewsDesk

Usage:
  python fetch_from_drive.py
"""

import json
import os
import sys
from pathlib import Path

# Google API libraries (pip install google-auth google-api-python-client)
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

# ── Config ────────────────────────────────────────────────────────────────────

ROOT      = Path(__file__).parent
TEMP_NEWS = ROOT / "temp_news.txt"

# Loaded from environment (set by GitHub Actions)
SERVICE_ACCOUNT_JSON = os.environ.get("GDRIVE_SERVICE_ACCOUNT_JSON", "")
FOLDER_ID            = os.environ.get("GDRIVE_FOLDER_ID", "1rxnEbEk6SUZUKAmTLHj2nkNUzfTleimW")

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


# ── Auth ──────────────────────────────────────────────────────────────────────

def get_drive_service():
    """Authenticate with Service Account and return a Drive API client."""
    if not SERVICE_ACCOUNT_JSON:
        print("[ERROR] GDRIVE_SERVICE_ACCOUNT_JSON is not set")
        sys.exit(1)
    if not FOLDER_ID:
        print("[ERROR] GDRIVE_FOLDER_ID is not set")
        sys.exit(1)

    try:
        sa_info = json.loads(SERVICE_ACCOUNT_JSON)
    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse service account JSON: {e}")
        sys.exit(1)

    credentials = service_account.Credentials.from_service_account_info(
        sa_info, scopes=SCOPES
    )
    service = build("drive", "v3", credentials=credentials, cache_discovery=False)
    return service


# ── Find latest JSON ──────────────────────────────────────────────────────────

def get_latest_json_file(service):
    """
    List all JSON files in the target folder, return the most recently
    modified one (Google Drive sorts by modifiedTime desc).
    """
    query = (
        f"'{FOLDER_ID}' in parents"
        " and mimeType='application/json'"
        " and trashed=false"
    )
    result = service.files().list(
        q=query,
        orderBy="modifiedTime desc",
        pageSize=1,
        fields="files(id, name, modifiedTime)",
    ).execute()

    files = result.get("files", [])
    if not files:
        print(f"[ERROR] No JSON files found in folder: {FOLDER_ID}")
        sys.exit(1)

    latest = files[0]
    print(f"[DRIVE] Latest file: {latest['name']} (modified: {latest['modifiedTime']})")
    return latest


# ── Download & extract ────────────────────────────────────────────────────────

def download_and_extract(service, file_meta: dict) -> str:
    """Download the file and extract the 'content' field."""
    file_id = file_meta["id"]

    request = service.files().get_media(fileId=file_id)
    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)

    done = False
    while not done:
        _, done = downloader.next_chunk()

    raw = buffer.getvalue().decode("utf-8")

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON decode failed: {e}")
        sys.exit(1)

    # The Apps Script saves the desk under the key 'content'
    content = data.get("content", "")
    if not content:
        print("[ERROR] 'content' field is missing or empty in the JSON file")
        # Fallback: try the raw text if it's not wrapped in an object
        if isinstance(data, str):
            content = data
        elif isinstance(data, list):
            content = "\n".join(str(item) for item in data)
        else:
            print("[DEBUG] Keys found:", list(data.keys()))
            sys.exit(1)

    return content


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("[STEP_0] Authenticating with Google Drive...")
    service = get_drive_service()
    print("[STEP_0_COMPLETE]")

    print("[STEP_1] Finding latest JSON in NewsDesk folder...")
    file_meta = get_latest_json_file(service)
    print("[STEP_1_COMPLETE]")

    print("[STEP_2] Downloading and extracting content...")
    content = download_and_extract(service, file_meta)
    print(f"[STEP_2_COMPLETE] {len(content)} characters extracted")

    print(f"[STEP_3] Writing to {TEMP_NEWS}...")
    TEMP_NEWS.write_text(content, encoding="utf-8")
    print("[STEP_3_COMPLETE]")

    print("[FETCH_DONE] temp_news.txt is ready for generate_website.py")


if __name__ == "__main__":
    main()
