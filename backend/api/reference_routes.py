"""Reference image routes."""

import email
from email import policy
from typing import Any

from backend.services import reference_service
from backend.utils import files
from backend.utils.validation import ValidationError


def _parse_multipart_upload(body: bytes, content_type: str) -> tuple[str, bytes, str]:
    if "multipart/form-data" not in content_type:
        raise ValidationError("Expected a multipart/form-data upload.")
    raw = (
        b"Content-Type: " + content_type.encode("latin-1", "replace")
        + b"\r\nMIME-Version: 1.0\r\n\r\n" + body
    )
    msg = email.message_from_bytes(raw, policy=policy.default)
    for part in msg.iter_parts():
        if part.is_multipart():
            continue
        filename = part.get_filename()
        payload = part.get_payload(decode=True)
        if not isinstance(payload, bytes):
            continue
        data: bytes = payload
        mime = part.get_content_type() or "application/octet-stream"
        if filename:
            return filename, data, mime
    raise ValidationError("No file part found in upload.")


def handle_get_references(ctx: Any, _params: dict[str, str], _body: Any) -> None:
    ctx.send_json(200, reference_service.list_references())


def handle_upload(ctx: Any, ref_type: str) -> None:
    body = ctx.read_body_bytes()
    content_type = ctx.headers.get("Content-Type", "")
    filename, data, mime = _parse_multipart_upload(body, content_type)
    if len(data) > files.MAX_UPLOAD_BYTES:
        raise ValidationError("File exceeds the 20 MB upload limit.")
    record = reference_service.save_reference(ref_type, filename, data, mime)
    ctx.send_json(200, {"ok": True, "reference": record})


def handle_delete(ctx: Any, ref_type: str) -> None:
    reference_service.delete_reference(ref_type)
    ctx.send_json(200, {"ok": True})


def handle_get_file(ctx: Any, ref_id: str) -> None:
    result = reference_service.get_reference_by_id(ref_id)
    if result is None:
        ctx.send_json(404, {"error": "Reference not found."})
        return
    path, mime = result
    ctx.send_file(path, mime, inline=True)


def register(router: Any) -> None:
    router.add("GET", "/api/references", handle_get_references)
    router.add("POST", "/api/references/model", lambda c, p, b: handle_upload(c, "model"))
    router.add("POST", "/api/references/outfit", lambda c, p, b: handle_upload(c, "outfit"))
    router.add("DELETE", "/api/references/model", lambda c, p, b: handle_delete(c, "model"))
    router.add("DELETE", "/api/references/outfit", lambda c, p, b: handle_delete(c, "outfit"))
    router.add("GET", "/api/references/{id}/file", lambda c, p, b: handle_get_file(c, p["id"]))
