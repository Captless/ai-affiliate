"""API key routes."""

from typing import Any

from backend.services import api_key_service
from backend.utils.validation import ValidationError, require


def handle_list(ctx: Any, _params: dict[str, str], _body: Any) -> None:
    ctx.send_json(200, {"keys": api_key_service.list_keys()})


def handle_create(ctx: Any, _params: dict[str, str], _body: Any) -> None:
    body = ctx.read_json()
    label = require(body, "label")
    raw_key = require(body, "key")
    if not isinstance(label, str) or not isinstance(raw_key, str):
        raise ValidationError("label and key must be strings.")
    key = api_key_service.create_key(label, raw_key)
    ctx.send_json(201, {"ok": True, "key": key})


def handle_delete(ctx: Any, params: dict[str, str], _body: Any) -> None:
    api_key_service.delete_key(params["id"])
    ctx.send_json(200, {"ok": True})


def handle_update(ctx: Any, params: dict[str, str], _body: Any) -> None:
    body = ctx.read_json()
    updated = api_key_service.update_key(
        params["id"],
        label=body.get("label"),
        is_enabled=body.get("is_enabled"),
        is_primary=bool(body.get("is_primary")),
    )
    ctx.send_json(200, {"ok": True, "key": updated})


def handle_test(ctx: Any, params: dict[str, str], _body: Any) -> None:
    updated = api_key_service.test_key(params["id"])
    ctx.send_json(200, {"ok": True, "key": updated})


def handle_balance(ctx: Any, params: dict[str, str], _body: Any) -> None:
    updated = api_key_service.refresh_balance(params["id"])
    ctx.send_json(200, {"ok": True, "key": updated})


def register(router: Any) -> None:
    router.add("GET", "/api/keys", handle_list)
    router.add("POST", "/api/keys", handle_create)
    router.add("DELETE", "/api/keys/{id}", handle_delete)
    router.add("PUT", "/api/keys/{id}", handle_update)
    router.add("POST", "/api/keys/{id}/test", handle_test)
    router.add("GET", "/api/keys/{id}/balance", handle_balance)
