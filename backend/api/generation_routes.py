"""Generation routes."""

from typing import Any

from backend.services import generation_service
from backend.utils.validation import ValidationError


def handle_create(ctx: Any, _params: dict[str, str], _body: Any) -> None:
    body = ctx.read_json()
    generation = generation_service.submit_generation(body)
    ctx.send_json(202, {"ok": True, "generation": generation})


def handle_list(ctx: Any, _params: dict[str, str], _body: Any) -> None:
    try:
        limit = int(ctx.query_params.get("limit", ["200"])[0])
    except ValueError:
        limit = 200
    ctx.send_json(200, {"generations": generation_service.list_generations(limit)})


def handle_get(ctx: Any, params: dict[str, str], _body: Any) -> None:
    generation = generation_service.get_generation(params["id"])
    ctx.send_json(200, {"generation": generation})


def handle_delete(ctx: Any, params: dict[str, str], _body: Any) -> None:
    generation_service.delete_generation(params["id"])
    ctx.send_json(200, {"ok": True})


def handle_file(ctx: Any, gen_id: str) -> None:
    result = generation_service.get_generation_file(gen_id)
    if result is None:
        ctx.send_json(404, {"error": "Output file not found."})
        return
    path, mime = result
    ctx.send_file(path, mime, inline=True, download_name=f"{gen_id}{path.suffix}")


def register(router: Any) -> None:
    router.add("POST", "/api/generate", handle_create)
    router.add("GET", "/api/generations", handle_list)
    router.add("GET", "/api/generations/{id}", handle_get)
    router.add("DELETE", "/api/generations/{id}", handle_delete)
    router.add("GET", "/api/generations/{id}/file", lambda c, p, b: handle_file(c, p["id"]))
