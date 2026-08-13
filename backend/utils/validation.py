"""Backend request validation helpers."""

import os
from typing import Any


class ValidationError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def require(body: dict[str, Any], key: str) -> Any:
    value = body.get(key)
    if value is None:
        raise ValidationError(f"Missing required field: {key}")
    return value


def optional_string(body: dict[str, Any], key: str) -> str | None:
    value = body.get(key)
    if value is None or value == "":
        return None
    if not isinstance(value, str):
        raise ValidationError(f"Field {key} must be a string")
    return value.strip() or None


def optional_bool(body: dict[str, Any], key: str) -> bool | None:
    value = body.get(key)
    if value is None:
        return None
    return bool(value)


def one_of(value: str | None, allowed: set[str], field: str) -> str | None:
    if value is None:
        return None
    if value not in allowed:
        raise ValidationError(
            f"Field {field} must be one of: {', '.join(sorted(allowed))}"
        )
    return value
