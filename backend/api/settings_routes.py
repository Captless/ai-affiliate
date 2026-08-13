"""Settings routes."""

from typing import Any

from backend.services import settings_service


def handle_get(ctx: Any, _params: dict[str, str], _body: Any) -> None:
    ctx.send_json(200, {"settings": settings_service.get_settings()})


def handle_update(ctx: Any, _params: dict[str, str], _body: Any) -> None:
    body = ctx.read_json()
    ctx.send_json(200, {"settings": settings_service.update_settings(body)})


def register(router: Any) -> None:
    router.add("GET", "/api/settings", handle_get)
    router.add("PUT", "/api/settings", handle_update)
