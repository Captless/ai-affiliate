"""API key management: CRUD, masking, obfuscation, and selection strategy.

Selection logic lives here and nowhere else.
"""

import base64
import datetime
import re
from typing import Any

from backend.database.database import connect, row_to_dict
from backend.models.api_key import ApiKeyRecord
from backend.services import wavespeed_service
from backend.utils import files
from backend.utils.validation import ValidationError

_OBF_KEY = b"ai-affiliate-studio-local-v1"


def _obfuscate(secret: str) -> str:
    data = secret.encode("utf-8")
    key = (_OBF_KEY * (len(data) // len(_OBF_KEY) + 1))[: len(data)]
    return base64.urlsafe_b64encode(bytes(a ^ b for a, b in zip(data, key))).decode()


def _deobfuscate(obf: str) -> str:
    data = base64.urlsafe_b64decode(obf.encode("ascii"))
    key = (_OBF_KEY * (len(data) // len(_OBF_KEY) + 1))[: len(data)]
    return bytes(a ^ b for a, b in zip(data, key)).decode()


def _mask(raw: str) -> str:
    raw = raw.strip()
    if len(raw) <= 8:
        return raw[:2] + "••••"
    return raw[:3] + "••••••••••••••••" + raw[-4:]


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _from_row(row: Any) -> ApiKeyRecord:
    return ApiKeyRecord(
        id=row["id"],
        label=row["label"],
        masked=row["masked"],
        secret_obf=row["secret_obf"],
        status=row["status"],
        is_enabled=bool(row["is_enabled"]),
        is_primary=bool(row["is_primary"]),
        last_error=row["last_error"],
        last_success_at=row["last_success_at"],
        last_checked_at=row["last_checked_at"],
        balance=row["balance"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _validate_key_format(raw: str) -> None:
    if not raw or not isinstance(raw, str):
        raise ValidationError("API key must be a non-empty string.")
    if len(raw) < 12:
        raise ValidationError("API key looks too short to be valid.")
    if len(raw) > 512:
        raise ValidationError("API key is too long.")
    if re.search(r"\s", raw):
        raise ValidationError("API key must not contain whitespace.")


def list_keys() -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM api_keys ORDER BY is_primary DESC, created_at ASC"
        ).fetchall()
    return [_from_row(r).to_public_dict() for r in rows]


def create_key(label: str, raw_key: str) -> dict[str, Any]:
    label = (label or "").strip() or "Untitled Key"
    _validate_key_format(raw_key)
    key_id = files.new_id()
    now = _now()
    with connect() as conn:
        count = conn.execute("SELECT COUNT(*) AS c FROM api_keys").fetchone()["c"]
        is_primary = 1 if count == 0 else 0
        conn.execute(
            """INSERT INTO api_keys
               (id, label, masked, secret_obf, status, is_enabled, is_primary,
                created_at, updated_at)
               VALUES (?, ?, ?, ?, 'untested', 1, ?, ?, ?)""",
            (key_id, label, _mask(raw_key), _obfuscate(raw_key), is_primary, now, now),
        )
    return get_key(key_id).to_public_dict()


def get_key(key_id: str) -> ApiKeyRecord:
    with connect() as conn:
        row = conn.execute("SELECT * FROM api_keys WHERE id = ?", (key_id,)).fetchone()
    if row is None:
        raise ValidationError("API key not found.", status=404)
    return _from_row(row)


def get_key_secret(key_id: str) -> str:
    return _deobfuscate(get_key(key_id).secret_obf)


def update_key(
    key_id: str,
    *,
    label: str | None = None,
    is_enabled: bool | None = None,
    is_primary: bool | None = None,
) -> dict[str, Any]:
    record = get_key(key_id)
    now = _now()
    with connect() as conn:
        if is_primary:
            conn.execute("UPDATE api_keys SET is_primary = 0")
        conn.execute(
            """UPDATE api_keys SET
                 label = COALESCE(?, label),
                 is_enabled = COALESCE(?, is_enabled),
                 is_primary = COALESCE(?, is_primary),
                 status = CASE
                   WHEN ? = 0 THEN 'disabled'
                   WHEN status = 'disabled' THEN 'untested'
                   ELSE status
                 END,
                 updated_at = ?
               WHERE id = ?""",
            (
                label.strip() if label is not None else None,
                int(is_enabled) if is_enabled is not None else None,
                int(is_primary) if is_primary is not None else None,
                int(is_enabled) if is_enabled is not None else None,
                now,
                key_id,
            ),
        )
        if record.is_primary and is_primary is False:
            # ensure at least one primary remains
            remaining = conn.execute(
                "SELECT id FROM api_keys WHERE is_primary = 1 LIMIT 1"
            ).fetchone()
            if remaining is None:
                first = conn.execute(
                    "SELECT id FROM api_keys ORDER BY created_at ASC LIMIT 1"
                ).fetchone()
                if first is not None:
                    conn.execute("UPDATE api_keys SET is_primary = 1 WHERE id = ?", (first["id"],))
    return get_key(key_id).to_public_dict()


def delete_key(key_id: str) -> None:
    record = get_key(key_id)
    with connect() as conn:
        conn.execute("DELETE FROM api_keys WHERE id = ?", (key_id,))
        if record.is_primary:
            remaining = conn.execute(
                "SELECT id FROM api_keys ORDER BY created_at ASC LIMIT 1"
            ).fetchone()
            if remaining is not None:
                conn.execute("UPDATE api_keys SET is_primary = 1 WHERE id = ?", (remaining["id"],))


def test_key(key_id: str) -> dict[str, Any]:
    record = get_key(key_id)
    secret = _deobfuscate(record.secret_obf)
    now = _now()
    status = "active"
    last_error: str | None = None
    balance: float | None = None
    try:
        balance = wavespeed_service.check_balance(secret)
    except wavespeed_service.WaveSpeedError as exc:
        status = "error" if not record.is_enabled else "error"
        last_error = exc.user_message
    with connect() as conn:
        conn.execute(
            """UPDATE api_keys SET
                 status = ?, balance = ?, last_error = ?, last_checked_at = ?,
                 last_success_at = CASE WHEN ? = 'active' THEN ? ELSE last_success_at END,
                 updated_at = ?
               WHERE id = ?""",
            (status, balance, last_error, now, status, now, now, key_id),
        )
    return get_key(key_id).to_public_dict()


def refresh_balance(key_id: str) -> dict[str, Any]:
    record = get_key(key_id)
    secret = _deobfuscate(record.secret_obf)
    now = _now()
    balance: float | None = None
    last_error: str | None = None
    try:
        balance = wavespeed_service.check_balance(secret)
    except wavespeed_service.WaveSpeedError as exc:
        last_error = exc.user_message
    with connect() as conn:
        conn.execute(
            """UPDATE api_keys SET
                 balance = ?, last_error = ?, last_checked_at = ?, updated_at = ?
               WHERE id = ?""",
            (balance, last_error, now, now, key_id),
        )
    return get_key(key_id).to_public_dict()


def mark_error(key_id: str, message: str) -> None:
    now = _now()
    with connect() as conn:
        conn.execute(
            """UPDATE api_keys SET status = 'error', last_error = ?,
               updated_at = ? WHERE id = ?""",
            (message, now, key_id),
        )


def mark_success(key_id: str) -> None:
    now = _now()
    with connect() as conn:
        conn.execute(
            """UPDATE api_keys SET status = 'active', last_error = NULL,
               last_success_at = ?, updated_at = ? WHERE id = ?""",
            (now, now, key_id),
        )


def select_key(strategy: str, manual_key_id: str | None = None) -> ApiKeyRecord:
    """Pick the API key to use for a request.

    strategy == 'auto'  -> primary active key first, then any enabled key
                           that is not in an error state.
    strategy == 'manual' -> the designated key if enabled and usable.
    """
    with connect() as conn:
        rows = conn.execute("SELECT * FROM api_keys ORDER BY created_at ASC").fetchall()
    records = [_from_row(r) for r in rows]

    if strategy == "manual":
        if manual_key_id:
            match = next((r for r in records if r.id == manual_key_id), None)
            if match is None:
                raise ValidationError("The selected API key no longer exists.", status=400)
            if not match.is_enabled or match.status == "disabled":
                raise ValidationError("The selected API key is disabled.", status=400)
            return match
        raise ValidationError("No API key selected. Enable a key first.", status=400)

    usable = [r for r in records if r.is_enabled and r.status != "disabled"]
    if not usable:
        raise ValidationError(
            "No API keys available. Add and enable a WaveSpeed API key first.",
            status=400,
        )
    primary = next((r for r in usable if r.is_primary), None)
    if primary is not None and primary.status != "error":
        return primary
    healthy = [r for r in usable if r.status != "error"]
    if healthy:
        return healthy[0]
    return usable[0]
