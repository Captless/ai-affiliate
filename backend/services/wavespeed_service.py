"""WaveSpeed API integration. All WaveSpeed-specific behavior lives here.

Source of truth: https://wavespeed.ai/docs
Target model: Nano Banana 2 Edit (google/nano-banana-2/edit).

Auth:     Authorization: Bearer <key>
Submit:   POST /api/v3/google/nano-banana-2/edit
Poll:     GET  /api/v3/predictions/{id}/result
Balance:  GET  /api/v3/balance
Upload:   POST /api/v3/media/uploads  (then PUT bytes to returned URL)
"""

import json
import mimetypes
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

API_BASE = "https://api.wavespeed.ai/api/v3"
EDIT_ENDPOINT = f"{API_BASE}/google/nano-banana-2/edit"
RESULT_ENDPOINT = f"{API_BASE}/predictions"
BALANCE_ENDPOINT = f"{API_BASE}/balance"
UPLOAD_ENDPOINT = f"{API_BASE}/media/uploads"

VALID_ASPECT_RATIOS = {
    "1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4",
    "9:16", "16:9", "21:9", "1:4", "4:1", "1:8", "8:1",
}
VALID_RESOLUTIONS = {"0.5k", "1k", "2k", "4k"}
VALID_OUTPUT_FORMATS = {"png", "jpeg"}

POLL_INTERVAL_S = 3.0
MAX_POLL_SECONDS = 900  # 15 minutes


class WaveSpeedError(Exception):
    """Carries a user-friendly message plus optional diagnostic details."""

    def __init__(
        self,
        user_message: str,
        *,
        code: int | None = None,
        detail: str | None = None,
        auth_failed: bool = False,
        http_status: int | None = None,
    ):
        super().__init__(user_message)
        self.user_message = user_message
        self.code = code
        self.detail = detail
        self.auth_failed = auth_failed
        self.http_status = http_status


def _request(
    method: str,
    url: str,
    api_key: str,
    *,
    json_body: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    timeout: float = 60,
    raw_body: bytes | None = None,
) -> tuple[int, dict[str, Any]]:
    request_headers: dict[str, str] = {"Authorization": f"Bearer {api_key}"}
    if headers:
        request_headers.update(headers)
    data = None
    if json_body is not None:
        request_headers["Content-Type"] = "application/json"
        data = json.dumps(json_body).encode("utf-8")
    elif raw_body is not None:
        data = raw_body
    req = urllib.request.Request(url, data=data, method=method, headers=request_headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            body_bytes = response.read()
            try:
                body: dict[str, Any] = json.loads(body_bytes.decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                body = {"raw": body_bytes.decode("utf-8", errors="replace")}
            return response.status, body
    except urllib.error.HTTPError as exc:
        detail = ""
        try:
            payload = json.loads(exc.read().decode("utf-8"))
            detail = payload.get("error") or payload.get("message") or ""
        except Exception:
            detail = ""
        if exc.code in (401, 403):
            raise WaveSpeedError(
                "Authentication failed — API key is invalid or revoked.",
                auth_failed=True,
                http_status=exc.code,
                detail=detail,
            )
        raise WaveSpeedError(
            _friendly_http_message(exc.code),
            http_status=exc.code,
            detail=detail or f"HTTP {exc.code}",
        )
    except urllib.error.URLError as exc:
        raise WaveSpeedError(
            "Could not reach the WaveSpeed API. Check your network connection.",
            detail=str(exc.reason) if exc.reason else None,
        )
    except TimeoutError:
        raise WaveSpeedError("The WaveSpeed API request timed out.", detail="timeout")


def _friendly_http_message(status: int) -> str:
    if status == 400:
        return "The WaveSpeed API rejected the request payload."
    if status == 402:
        return "Insufficient balance. Top up your WaveSpeed account and retry."
    if status == 429:
        return "WaveSpeed rate limit reached. Wait a moment and retry."
    if status >= 500:
        return "WaveSpeed API is temporarily unavailable. Try again shortly."
    return f"WaveSpeed API error (HTTP {status})."


def _friendly_error(code: int, message: str) -> str:
    mapping = {
        1200: "The request was blocked by content moderation.",
        1400: "A required parameter is missing.",
        1401: "One of the parameters is invalid.",
        1402: "WaveSpeed could not access one of the reference images.",
        1403: "The generation task could not be completed.",
        1405: "The generation task failed.",
        5000: "WaveSpeed hit an internal error. Try again shortly.",
        5003: "WaveSpeed is temporarily unavailable. Try again shortly.",
        5004: "The WaveSpeed request timed out.",
    }
    return mapping.get(code, message or "WaveSpeed generation failed.")


def submit_edit(
    api_key: str,
    prompt: str,
    images: list[str],
    *,
    aspect_ratio: str | None = None,
    resolution: str | None = None,
    output_format: str | None = None,
    enable_image_search: bool = False,
    enable_web_search: bool = False,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "prompt": prompt,
        "images": images,
    }
    if aspect_ratio:
        body["aspect_ratio"] = aspect_ratio
    if resolution:
        body["resolution"] = resolution
    if output_format:
        body["output_format"] = output_format
    if enable_image_search:
        body["enable_image_search"] = True
    if enable_web_search:
        body["enable_web_search"] = True

    status, response = _request("POST", EDIT_ENDPOINT, api_key, json_body=body)
    data = response.get("data") if isinstance(response, dict) else None
    if not data or not data.get("id"):
        message = response.get("message", "Unexpected WaveSpeed response.") if isinstance(response, dict) else "Unexpected WaveSpeed response."
        raise WaveSpeedError(
            _friendly_error(response.get("code", 0) if isinstance(response, dict) else 0, message),
            code=response.get("code") if isinstance(response, dict) else None,
            http_status=status,
        )
    return data


def get_result(api_key: str, task_id: str) -> dict[str, Any]:
    url = f"{RESULT_ENDPOINT}/{task_id}/result"
    status, response = _request("GET", url, api_key)
    data = response.get("data") if isinstance(response, dict) else None
    if not isinstance(data, dict):
        raise WaveSpeedError("Unexpected result payload from WaveSpeed.", http_status=status)
    return data


def poll_until_done(api_key: str, task_id: str) -> dict[str, Any]:
    """Poll a task until it reaches a terminal state.

    Returns the final result data (status 'completed' or 'failed').
    """
    deadline = time.time() + MAX_POLL_SECONDS
    interval = POLL_INTERVAL_S
    while time.time() < deadline:
        data = get_result(api_key, task_id)
        status = data.get("status")
        if status in ("completed", "failed", "cancelled", "timeout"):
            return data
        time.sleep(interval)
    raise WaveSpeedError(
        "The generation took too long and timed out.",
        detail=f"task {task_id}",
    )


def check_balance(api_key: str) -> float:
    _, response = _request("GET", BALANCE_ENDPOINT, api_key)
    data = response.get("data") if isinstance(response, dict) else None
    if not isinstance(data, dict) or "balance" not in data:
        raise WaveSpeedError("Unexpected balance payload from WaveSpeed.")
    return float(data["balance"])


def upload_image(api_key: str, file_path: Path, filename: str) -> str:
    """Upload a local image to WaveSpeed storage and return its download URL."""
    size = file_path.stat().st_size
    content_type = mimetypes.guess_type(filename)[0] or "image/png"
    _, response = _request(
        "POST",
        UPLOAD_ENDPOINT,
        api_key,
        json_body={
            "filename": filename,
            "size": size,
            "content_type": content_type,
        },
        timeout=30,
    )
    data = response.get("data") if isinstance(response, dict) else None
    if not isinstance(data, dict):
        raise WaveSpeedError("Unexpected upload ticket from WaveSpeed.")

    upload = data.get("upload")
    if not isinstance(upload, dict) or not upload.get("url"):
        raise WaveSpeedError("Upload ticket missing upload URL.")

    raw = file_path.read_bytes()
    upload_headers = {str(k): str(v) for k, v in upload.get("headers", {}).items()}
    try:
        _request(
            upload.get("method", "PUT"),
            upload["url"],
            api_key,
            raw_body=raw,
            headers=upload_headers,
            timeout=300,
        )
    except WaveSpeedError as exc:
        raise WaveSpeedError(
            "Failed to upload reference image to WaveSpeed.",
            detail=exc.detail,
            http_status=exc.http_status,
        )

    download_url = data.get("download_url")
    if not isinstance(download_url, str) or not download_url:
        raise WaveSpeedError("Upload response missing download URL.")
    return download_url
