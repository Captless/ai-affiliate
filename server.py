"""AI Affiliate Studio — local server entry point.

Kept thin on purpose. Application logic lives under backend/.
"""

import os
import sys
import threading
import webbrowser
from http.server import ThreadingHTTPServer
from typing import Any, cast

from backend.api.routes import AppHandler
from backend.database import database
from backend.services import generation_service
from backend.utils import files

HOST = "127.0.0.1"


def _verify_frontend_build() -> None:
    app_js = files.WEB_DIST_DIR / "app.js"
    styles = files.WEB_DIST_DIR / "styles.css"
    if not app_js.exists() or not styles.exists():
        print(
            "[warn] Frontend build not found in web/dist/. "
            "Run `npm install` then `npm run build` before using the app."
        )


def main() -> None:
    try:
        cast(Any, sys.stdout).reconfigure(encoding="utf-8", errors="replace")
        cast(Any, sys.stderr).reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    files.ensure_directories()
    database.init_db()
    _verify_frontend_build()

    generation_service.start_worker()
    AppHandler.build_router()

    start_port = int(os.environ.get("PORT", "8000"))
    server: ThreadingHTTPServer | None = None
    port = start_port
    for candidate in range(start_port, start_port + 20):
        try:
            server = ThreadingHTTPServer((HOST, candidate), AppHandler)
            port = candidate
            break
        except OSError:
            continue
    if server is None:
        print(f"[error] Could not bind any port from {start_port} to {start_port + 19}.")
        sys.exit(1)

    def open_browser() -> None:
        try:
            webbrowser.open(f"http://{HOST}:{port}")
        except Exception:  # noqa: BLE001 - browser opening is best effort
            pass

    from backend.services import settings_service

    settings = settings_service.get_settings()
    if settings.get("open_browser", True):
        threading.Timer(0.8, open_browser).start()

    url = f"http://{HOST}:{port}"
    print()
    print("  AI Affiliate Studio")
    print(f"  -> {url}")
    print("  Ctrl+C to stop")
    print()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Shutting down…")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
