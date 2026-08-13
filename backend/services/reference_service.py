"""Reference image persistence: model and outfit references.

Only the latest reference per type is considered active.
"""

import datetime
from pathlib import Path
from typing import Any

from backend.database.database import connect, row_to_dict
from backend.services import storage_service
from backend.utils import files
from backend.utils.validation import ValidationError

VALID_TYPES = {"model", "outfit"}


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _record_to_dict(row: Any) -> dict[str, Any]:
    data = row_to_dict(row) or {}
    data["url"] = f"/api/references/{data['id']}/file"
    return data


def list_references() -> dict[str, dict[str, Any] | None]:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM reference_images").fetchall()
    refs: dict[str, dict[str, Any] | None] = {"model": None, "outfit": None}
    for row in rows:
        ref_type = row["type"]
        if ref_type not in refs:
            continue
        existing = refs[ref_type]
        if existing is None or row["updated_at"] > existing["updated_at"]:
            refs[ref_type] = _record_to_dict(row)
    return refs


def save_reference(
    ref_type: str, filename: str, data: bytes, mime: str
) -> dict[str, Any]:
    if ref_type not in VALID_TYPES:
        raise ValidationError(f"Unknown reference type: {ref_type}")
    if not data:
        raise ValidationError("Reference image is empty.")
    if mime not in files.ALLOWED_IMAGE_MIME:
        raise ValidationError("Only PNG, JPEG, WEBP and GIF images are supported.")
    ext = Path(filename).suffix.lower()
    if ext not in files.ALLOWED_IMAGE_EXT:
        raise ValidationError("Unsupported image file type.")

    directory = files.REFERENCE_DIRS[ref_type]
    stored_name = f"{files.new_id()}{ext}"
    storage_service.save_bytes(directory, stored_name, data)

    now = _now()
    ref_id = files.new_id()
    with connect() as conn:
        previous = conn.execute(
            "SELECT * FROM reference_images WHERE type = ? ORDER BY updated_at DESC LIMIT 1",
            (ref_type,),
        ).fetchone()
        conn.execute(
            """INSERT INTO reference_images
               (id, type, filename, stored_name, mime, size, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (ref_id, ref_type, files.safe_filename(filename), stored_name, mime, len(data), now, now),
        )
        if previous is not None:
            storage_service.remove_file(
                files.REFERENCE_DIRS[ref_type] / previous["stored_name"]
            )
            conn.execute("DELETE FROM reference_images WHERE id = ?", (previous["id"],))
        created = conn.execute("SELECT * FROM reference_images WHERE id = ?", (ref_id,)).fetchone()

    return _record_to_dict(created)


def get_reference_file(ref_type: str) -> tuple[Path, str] | None:
    if ref_type not in VALID_TYPES:
        return None
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM reference_images WHERE type = ? ORDER BY updated_at DESC LIMIT 1",
            (ref_type,),
        ).fetchone()
    if row is None:
        return None
    path = files.ensure_within(
        files.REFERENCE_DIRS[ref_type],
        files.REFERENCE_DIRS[ref_type] / row["stored_name"],
    )
    if not path.exists():
        return None
    return path, row["mime"]


def get_reference_by_id(ref_id: str) -> tuple[Path, str] | None:
    with connect() as conn:
        row = conn.execute("SELECT * FROM reference_images WHERE id = ?", (ref_id,)).fetchone()
    if row is None:
        return None
    path = files.ensure_within(
        files.REFERENCE_DIRS[row["type"]],
        files.REFERENCE_DIRS[row["type"]] / row["stored_name"],
    )
    if not path.exists():
        return None
    return path, row["mime"]


def delete_reference(ref_type: str) -> None:
    if ref_type not in VALID_TYPES:
        raise ValidationError(f"Unknown reference type: {ref_type}")
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM reference_images WHERE type = ? ORDER BY updated_at DESC LIMIT 1",
            (ref_type,),
        ).fetchone()
        if row is not None:
            storage_service.remove_file(files.REFERENCE_DIRS[ref_type] / row["stored_name"])
            conn.execute("DELETE FROM reference_images WHERE id = ?", (row["id"],))
