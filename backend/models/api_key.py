"""Dataclasses for API key records."""

from dataclasses import dataclass
from typing import Any


@dataclass
class ApiKeyRecord:
    id: str
    label: str
    masked: str
    secret_obf: str
    status: str = "untested"
    is_enabled: bool = True
    is_primary: bool = False
    last_error: str | None = None
    last_success_at: str | None = None
    last_checked_at: str | None = None
    balance: float | None = None
    created_at: str | None = None
    updated_at: str | None = None

    def to_public_dict(self) -> dict[str, Any]:
        """Never expose the raw key to the frontend."""
        return {
            "id": self.id,
            "label": self.label,
            "masked": self.masked,
            "status": self.status,
            "is_enabled": self.is_enabled,
            "is_primary": self.is_primary,
            "last_error": self.last_error,
            "last_success_at": self.last_success_at,
            "last_checked_at": self.last_checked_at,
            "balance": self.balance,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
