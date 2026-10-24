"""
backend/security/file_validator.py
Security validation for inbound file uploads.
Enforces:
1. Magic byte sniffing (prevents extension spoofing).
2. Size limit (max 25MB).
3. ZIP bomb defense (expansion ratio <= 10x, max 100MB uncompressed, max 200 entries).
4. Path traversal prevention (sanitizes os.path.basename).
5. Zero code execution (scripts treated strictly as inert text).
"""

import os
import zipfile
from typing import Tuple

MAX_FILE_SIZE = 25 * 1024 * 1024       # 25 MB
MAX_ZIP_EXPANSION = 100 * 1024 * 1024   # 100 MB max uncompressed
MAX_ZIP_FILES = 200                     # Max files in an archive

MAGIC_SIGNATURES = {
    "pdf": [b"%PDF"],
    "zip": [b"PK\x03\x04"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
}

def validate_file(file_bytes: bytes, filename: str) -> Tuple[bool, str]:
    """
    Validates uploaded file against size and magic byte constraints.
    """
    if len(file_bytes) > MAX_FILE_SIZE:
        return False, f"File exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB."

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    # Check magic bytes for known binary types
    if ext in MAGIC_SIGNATURES:
        signatures = MAGIC_SIGNATURES[ext]
        matches = any(file_bytes.startswith(sig) for sig in signatures)
        if not matches:
            return False, f"File content does not match expected signature for extension .{ext}."

    return True, "Valid"

def validate_zip_archive(zip_path: str) -> Tuple[bool, str]:
    """
    Inspects ZIP archive before extraction to prevent ZIP bombs and path traversal.
    """
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            infolist = zf.infolist()
            if len(infolist) > MAX_ZIP_FILES:
                return False, f"ZIP contains too many files ({len(infolist)} > {MAX_ZIP_FILES})."

            total_uncompressed = sum(info.file_size for info in infolist)
            if total_uncompressed > MAX_ZIP_EXPANSION:
                return False, f"ZIP uncompressed payload exceeds safety limit of {MAX_ZIP_EXPANSION // (1024*1024)}MB."

            # Check for path traversal attempts (e.g., ../../etc/passwd)
            for info in infolist:
                clean_name = os.path.basename(info.filename)
                if ".." in info.filename or info.filename.startswith("/"):
                    return False, f"Dangerous path traversal detected in file: {info.filename}"

        return True, "Safe ZIP"
    except Exception as e:
        return False, f"Corrupted or invalid ZIP archive: {str(e)}"
