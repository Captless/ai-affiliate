"""App settings model."""

from typing import Any

DEFAULT_SETTINGS: dict[str, Any] = {
    "key_selection": "auto",
    "manual_key_id": None,
    "open_browser": True,
    "port": 8000,
}


def default_settings() -> dict[str, Any]:
    return dict(DEFAULT_SETTINGS)
