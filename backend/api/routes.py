"""HTTP dispatcher: route matching, request parsing, static file serving.

Route handlers stay thin; business logic lives in services.
"""

import json
import mimetypes
import re
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any, Callable

from backend.api import (
    api_key_routes,
    generation_routes,
    reference_routes,
    settings_routes,
)
from backend.utils import files
from backend.utils.validation import ValidationError

RouteHandler = Callable[[BaseHTTPRequestHandler, dict[str, str], Any], None]


class RouteConflictError(Exception):
    pass


class Router:
    def __init__(self) -> None:
        self._routes: list[tuple[str, str, RouteHandler, re.Pattern]] = []
        self._register_static()

    def add(self, method: str, pattern: str, handler: RouteHandler) -> None:
        regex = self._compile(pattern)
        self._routes.append((method.upper(), pattern, handler, regex))

    @staticmethod
    def _compile(pattern: str) -> re.Pattern:
        parts: list[str] = []
        for segment in pattern.strip("/").split("/"):
            if segment.startswith("{") and segment.endswith("}"):
                parts.append(f"(?P<{segment[1:-1]}>[^/]+)")
            else:
                parts.append(re.escape(segment))
        return re.compile("^/" + "/".join(parts) + "/?$")

    def _register_static(self) -> None:
        # Static assets live under web/dist; serve only files under that root.
        pass

    def match(
        self, method: str, path: str
    ) -> tuple[RouteHandler, dict[str, str]] | None:
        for http_method, _, handler, regex in self._routes:
            if http_method != method.upper():
                continue
            match = regex.match(path)
            if match:
                return handler, match.groupdict()
        return None


def _build_router() -> Router:
    router = Router()
    router.add("GET", "/api/health", handle_health)
    reference_routes.register(router)
    api_key_routes.register(router)
    generation_routes.register(router)
    settings_routes.register(router)
    return router


def handle_health(ctx: Any, _params: dict[str, str], _body: Any) -> None:
    ctx.send_json(200, {"ok": True, "service": "ai-affiliate-studio", "model": "nano-banana-2"})


class AppHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "AIAffiliateStudio/1.0"

    _router: Router | None = None

    @classmethod
    def build_router(cls) -> None:
        cls._router = _build_router()

    # ------------------------------------------------------------------ helpers

    @property
    def router(self) -> Router:
        if AppHandler._router is None:
            AppHandler.build_router()
        return AppHandler._router  # type: ignore[return-value]

    @property
    def query_params(self) -> dict[str, list[str]]:
        from urllib.parse import parse_qs, urlsplit

        return parse_qs(urlsplit(self.path).query)

    def read_json(self) -> dict[str, Any]:
        raw = self.read_body_bytes()
        if not raw:
            return {}
        try:
            parsed = json.loads(raw.decode("utf-8-sig"))
        except (ValueError, UnicodeDecodeError):
            raise ValidationError("Request body is not valid JSON.")
        if not isinstance(parsed, dict):
            raise ValidationError("Request body must be a JSON object.")
        return parsed

    def read_body_bytes(self) -> bytes:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return b""
        if length > 50 * 1024 * 1024:
            raise ValidationError("Request body too large.")
        return self.rfile.read(length)

    def send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_file(
        self,
        path: Path,
        mime: str,
        *,
        inline: bool = True,
        download_name: str | None = None,
    ) -> None:
        if not path.exists() or not path.is_file():
            self.send_json(404, {"error": "File not found."})
            return
        data = path.read_bytes()
        self.send_response(200)
        if mime:
            self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        disposition = "inline" if inline else "attachment"
        if download_name:
            disposition += f"; filename={download_name}"
        self.send_header("Content-Disposition", disposition)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _serve_static(self, path: str) -> bool:
        from urllib.parse import urlsplit

        url_path = urlsplit(path).path
        if url_path in ("", "/"):
            url_path = "/index.html"

        index_file = files.ROOT / "web" / "index.html"
        if url_path == "/index.html":
            if not index_file.is_file():
                return False
            self._write_static(index_file)
            return True

        if url_path.startswith("/dist/"):
            relative = url_path[len("/dist/"):]
            candidate = files.ensure_within(
                files.WEB_DIST_DIR, files.WEB_DIST_DIR / relative
            )
            if candidate.is_file():
                self._write_static(candidate)
                return True
            return False

        if url_path == "/favicon.ico":
            self.send_response(204)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return True

        return False

    def _write_static(self, candidate: Path) -> None:
        mime = mimetypes.guess_type(candidate.name)[0] or "application/octet-stream"
        data = candidate.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)

    # ------------------------------------------------------------------ dispatch

    def do_GET(self) -> None:
        self._dispatch("GET")

    def do_POST(self) -> None:
        self._dispatch("POST")

    def do_PUT(self) -> None:
        self._dispatch("PUT")

    def do_DELETE(self) -> None:
        self._dispatch("DELETE")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Allow", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _dispatch(self, method: str) -> None:
        from urllib.parse import urlsplit

        url_path = urlsplit(self.path).path
        try:
            if url_path.startswith("/api/"):
                matched = self.router.match(method, url_path)
                if matched is None:
                    self.send_json(404, {"error": "Endpoint not found."})
                    return
                handler, params = matched
                handler(self, params, None)
                return
            if method != "GET":
                self.send_json(405, {"error": "Method not allowed."})
                return
            if not self._serve_static(url_path):
                self.send_json(404, {"error": "Not found."})
        except ValidationError as exc:
            self.send_json(exc.status, {"error": exc.message})
        except BrokenPipeError:
            pass
        except Exception:  # noqa: BLE001 - surface unexpected errors as 500s
            import logging
            import traceback

            logging.getLogger(__name__).error(
                "Unhandled error: %s", traceback.format_exc()
            )
            try:
                self.send_json(500, {"error": "Internal server error."})
            except (BrokenPipeError, ConnectionResetError):
                pass
