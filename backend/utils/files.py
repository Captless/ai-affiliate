"""Filesystem helpers and storage path definitions."""

import os
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

DATA_DIR = ROOT / "data"
STORAGE_DIR = ROOT / "storage"
REFERENCE_DIR = STORAGE_DIR / "references"
MODEL_REFERENCE_DIR = REFERENCE_DIR / "model"
OUTFIT_REFERENCE_DIR = REFERENCE_DIR / "outfit"
OUTPUTS_DIR = STORAGE_DIR / "outputs"
GENERATIONS_DIR = OUTPUTS_DIR / "generations"
WEB_DIST_DIR = ROOT / "web" / "dist"

ALLOWED_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
ALLOWED_IMAGE_MIME = {"image/png", "image/jpeg", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 20 * 1024 * 1024

REFERENCE_DIRS = {
    "model": MODEL_REFERENCE_DIR,
    "outfit": OUTFIT_REFERENCE_DIR,
}


def ensure_directories() -> None:
    """Create every storage directory the application relies on."""
    for directory in (
        DATA_DIR,
        MODEL_REFERENCE_DIR,
        OUTFIT_REFERENCE_DIR,
        GENERATIONS_DIR,
    ):
        directory.mkdir(parents=True, exist_ok=True)


def new_id() -> str:
    return uuid.uuid4().hex


def safe_filename(name: str) -> str:
    """Strip any path components from a user-supplied filename."""
    normalized = name.replace("\\", "/")
    return os.path.basename(normalized)


def ensure_within(base: Path, candidate: Path) -> Path:
    """Raise if candidate resolves outside of base (path traversal guard)."""
    base_resolved = base.resolve()
    candidate_resolved = candidate.resolve()
    if not (
        candidate_resolved == base_resolved
        or str(candidate_resolved).startswith(str(base_resolved) + os.sep)
    ):
        raise ValueError("path escapes storage root")
    return candidate_resolved


def generation_dir(generation_id: str) -> Path:
    return ensure_within(GENERATIONS_DIR, GENERATIONS_DIR / generation_id)
