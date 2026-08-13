"""App settings persistence."""

import json
from typing import Any

from backend.database.database import connect
from backend.models.settings import DEFAULT_SETTINGS


def get_settings() -> dict[str, Any]:
    with connect() as conn:
        rows = conn.execute("SELECT key, value FROM settings").fetchall()
    stored = {row["key"]: json.loads(row["value"]) for row in rows}
    merged = dict(DEFAULT_SETTINGS)
    merged.update(stored)
    return merged


def update_settings(patch: dict[str, Any]) -> dict[str, Any]:
    current = get_settings()
    allowed = set(DEFAULT_SETTINGS.keys())
    with connect() as conn:
        for key, value in patch.items():
            if key not in allowed:
                continue
            conn.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (key, json.dumps(value)),
            )
    return get_settings()
