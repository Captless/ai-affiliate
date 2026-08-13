"""Filesystem storage for reference images and generated outputs."""

import shutil
from pathlib import Path

from backend.utils import files


def save_bytes(directory: Path, filename: str, data: bytes) -> Path:
    """Write raw bytes into a storage directory with a safe filename."""
    directory.mkdir(parents=True, exist_ok=True)
    safe = files.safe_filename(filename)
    path = files.ensure_within(directory, directory / safe)
    path.write_bytes(data)
    return path


def remove_file(path: Path) -> None:
    try:
        path.unlink(missing_ok=True)
    except OSError:
        pass


def remove_tree(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path, ignore_errors=True)


def delete_generation_files(generation_id: str) -> None:
    remove_tree(files.GENERATIONS_DIR / generation_id)
