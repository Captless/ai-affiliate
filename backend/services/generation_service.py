"""Generation job lifecycle: queue, background worker, persistence.

Generation is treated as an asynchronous job so the browser never blocks
on a long-running WaveSpeed request.
"""

import datetime
import logging
import queue
import threading
from pathlib import Path
from typing import Any

from backend.database.database import connect, row_to_dict
from backend.models.generation import GenerationRecord
from backend.services import api_key_service, reference_service, storage_service
from backend.services import wavespeed_service
from backend.utils import files
from backend.utils.validation import ValidationError

logger = logging.getLogger(__name__)

VALID_ASPECT_RATIOS = wavespeed_service.VALID_ASPECT_RATIOS
VALID_RESOLUTIONS = wavespeed_service.VALID_RESOLUTIONS
VALID_OUTPUT_FORMATS = wavespeed_service.VALID_OUTPUT_FORMATS

STATUSES = ("queued", "processing", "downloading", "completed", "failed")

_job_queue: queue.Queue[str] = queue.Queue()
_worker_started = False
_worker_lock = threading.Lock()


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _record_from_row(row: Any) -> GenerationRecord:
    return GenerationRecord(
        id=row["id"],
        status=row["status"],
        prompt=row["prompt"],
        aspect_ratio=row["aspect_ratio"],
        resolution=row["resolution"],
        output_format=row["output_format"],
        pose_id=row["pose_id"],
        generation_style=row["generation_style"],
        user_prompt=row["user_prompt"],
        model_reference_id=row["model_reference_id"],
        outfit_reference_id=row["outfit_reference_id"],
        api_key_id=row["api_key_id"],
        api_key_label=row["api_key_label"],
        wavespeed_task_id=row["wavespeed_task_id"],
        error=row["error"],
        file_path=row["file_path"],
        output_ext=row["output_ext"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        completed_at=row["completed_at"],
    )


def _generation_to_dict(record: GenerationRecord) -> dict[str, Any]:
    data = record.to_dict()
    data["image_url"] = (
        f"/api/generations/{record.id}/file" if record.file_path else None
    )
    data["thumbnail_url"] = data["image_url"]
    return data


def _update_status(gen_id: str, status: str, **fields: Any) -> None:
    sets = ["status = ?", "updated_at = ?"]
    values: list[Any] = [status, _now()]
    for key, value in fields.items():
        if key in {
            "error", "wavespeed_task_id", "file_path", "output_ext", "api_key_id",
            "api_key_label", "completed_at",
        }:
            sets.append(f"{key} = ?")
            values.append(value)
    values.append(gen_id)
    with connect() as conn:
        conn.execute(
            f"UPDATE generations SET {', '.join(sets)} WHERE id = ?", values
        )


def start_worker() -> None:
    global _worker_started
    with _worker_lock:
        if _worker_started:
            return
        thread = threading.Thread(
            target=_worker_loop, name="generation-worker", daemon=True
        )
        thread.start()
        _worker_started = True


def _worker_loop() -> None:
    while True:
        gen_id = _job_queue.get()
        try:
            _process_job(gen_id)
        except Exception:  # noqa: BLE001 - keep the worker alive
            logger.exception("Generation worker crashed for job %s", gen_id)
            try:
                _update_status(gen_id, "failed", error="Unexpected internal error.")
            except Exception:
                pass
        finally:
            _job_queue.task_done()


def submit_generation(payload: dict[str, Any]) -> dict[str, Any]:
    prompt = (payload.get("prompt") or "").strip()
    if not prompt:
        raise ValidationError("Prompt is required.")
    if len(prompt) > 10000:
        raise ValidationError("Prompt is too long.")

    aspect_ratio = payload.get("aspect_ratio") or None
    resolution = payload.get("resolution") or None
    output_format = payload.get("output_format") or None
    pose_id = payload.get("pose_id") or None
    generation_style = payload.get("generation_style") or None
    user_prompt = payload.get("user_prompt") or None

    if aspect_ratio not in VALID_ASPECT_RATIOS:
        raise ValidationError(
            f"aspect_ratio must be one of: {', '.join(sorted(VALID_ASPECT_RATIOS))}"
        )
    if resolution not in VALID_RESOLUTIONS:
        raise ValidationError(f"resolution must be one of: {', '.join(sorted(VALID_RESOLUTIONS))}")
    if output_format not in VALID_OUTPUT_FORMATS:
        raise ValidationError("output_format must be 'png' or 'jpeg'")

    refs = reference_service.list_references()
    model_ref = refs.get("model")
    outfit_ref = refs.get("outfit")
    if not model_ref:
        raise ValidationError("A model reference image is required before generating.")
    if not outfit_ref:
        raise ValidationError("An outfit reference image is required before generating.")

    # Validate a key exists before queueing.
    api_key_service.select_key(
        payload.get("key_selection", "auto"), payload.get("manual_key_id")
    )

    now = _now()
    gen_id = files.new_id()
    with connect() as conn:
        conn.execute(
            """INSERT INTO generations
               (id, status, prompt, aspect_ratio, resolution, output_format,
                pose_id, generation_style, user_prompt,
                model_reference_id, outfit_reference_id, created_at, updated_at)
               VALUES (?, 'queued', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                gen_id,
                prompt,
                aspect_ratio,
                resolution,
                output_format,
                pose_id,
                generation_style,
                user_prompt,
                model_ref["id"],
                outfit_ref["id"],
                now,
                now,
            ),
        )

    start_worker()
    _job_queue.put(gen_id)
    return get_generation(gen_id)


def _process_job(gen_id: str) -> None:
    record = _record_from_row(_fetch_row(gen_id))
    _update_status(gen_id, "processing")

    selected = api_key_service.select_key("auto")
    if selected is None:
        _update_status(gen_id, "failed", error="No API key available.")
        return
    secret = api_key_service.get_key_secret(selected.id)
    _update_status(gen_id, "api_key_id", api_key_id=selected.id, api_key_label=selected.label)

    model_ref_file = reference_service.get_reference_by_id(record.model_reference_id or "")
    outfit_ref_file = reference_service.get_reference_by_id(record.outfit_reference_id or "")
    if model_ref_file is None or outfit_ref_file is None:
        _update_status(gen_id, "failed", error="Reference images are missing.")
        return
    model_path = model_ref_file[0]
    outfit_path = outfit_ref_file[0]

    try:
        model_url = wavespeed_service.upload_image(
            secret, model_path, model_path.name
        )
        outfit_url = wavespeed_service.upload_image(
            secret, outfit_path, outfit_path.name
        )
    except wavespeed_service.WaveSpeedError as exc:
        api_key_service.mark_error(selected.id, exc.user_message)
        _update_status(gen_id, "failed", error=exc.user_message)
        return

    try:
        task = wavespeed_service.submit_edit(
            secret,
            record.prompt,
            [model_url, outfit_url],
            aspect_ratio=record.aspect_ratio,
            resolution=record.resolution,
            output_format=record.output_format,
        )
        task_id = task.get("id")
        if not isinstance(task_id, str) or not task_id:
            raise wavespeed_service.WaveSpeedError(
                "WaveSpeed did not return a task id."
            )
        _update_status(gen_id, "processing", wavespeed_task_id=task_id)
        result = wavespeed_service.poll_until_done(secret, task_id)
    except wavespeed_service.WaveSpeedError as exc:
        api_key_service.mark_error(selected.id, exc.user_message)
        _update_status(gen_id, "failed", error=exc.user_message)
        return

    if result.get("status") != "completed":
        error_message = result.get("error") or "Generation failed."
        friendly = wavespeed_service._friendly_error(
            result.get("code") or 0, error_message
        )
        api_key_service.mark_error(selected.id, friendly)
        _update_status(gen_id, "failed", error=friendly)
        return

    outputs = result.get("outputs")
    outputs = outputs if isinstance(outputs, list) else []
    output_url = outputs[0] if outputs else None
    if not isinstance(output_url, str):
        _update_status(gen_id, "failed", error="WaveSpeed returned no output image.")
        return

    _update_status(gen_id, "downloading")
    try:
        saved_path = _download_output(gen_id, output_url, record.output_format or "png")
    except wavespeed_service.WaveSpeedError as exc:
        api_key_service.mark_error(selected.id, exc.user_message)
        _update_status(gen_id, "failed", error=exc.user_message)
        return

    api_key_service.mark_success(selected.id)
    _update_status(
        gen_id,
        "completed",
        file_path=str(saved_path.relative_to(files.GENERATIONS_DIR)),
        output_ext=saved_path.suffix.lstrip("."),
        completed_at=_now(),
    )


def _download_output(gen_id: str, url: str, output_format: str) -> Path:
    ext = ".png" if output_format == "png" else ".jpeg"
    directory = files.generation_dir(gen_id)
    directory.mkdir(parents=True, exist_ok=True)
    filename = f"image{ext}"
    path = files.ensure_within(directory, directory / filename)

    import urllib.error
    import urllib.request

    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            data = response.read()
    except urllib.error.HTTPError as exc:
        raise wavespeed_service.WaveSpeedError(
            "Failed to download the generated image.",
            http_status=exc.code,
            detail=f"HTTP {exc.code}",
        )
    except urllib.error.URLError as exc:
        raise wavespeed_service.WaveSpeedError(
            "Failed to download the generated image.",
            detail=str(exc.reason) if exc.reason else None,
        )
    if not data:
        raise wavespeed_service.WaveSpeedError("The generated image was empty.")
    path.write_bytes(data)
    return path


def _fetch_row(gen_id: str) -> Any:
    with connect() as conn:
        return conn.execute(
            "SELECT * FROM generations WHERE id = ?", (gen_id,)
        ).fetchone()


def get_generation(gen_id: str) -> dict[str, Any]:
    row = _fetch_row(gen_id)
    if row is None:
        raise ValidationError("Generation not found.", status=404)
    return _generation_to_dict(_record_from_row(row))


def list_generations(limit: int = 200) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM generations ORDER BY created_at DESC LIMIT ?",
            (min(max(limit, 1), 500),),
        ).fetchall()
    return [_generation_to_dict(_record_from_row(r)) for r in rows]


def delete_generation(gen_id: str) -> None:
    row = _fetch_row(gen_id)
    if row is None:
        raise ValidationError("Generation not found.", status=404)
    storage_service.delete_generation_files(gen_id)
    with connect() as conn:
        conn.execute("DELETE FROM generations WHERE id = ?", (gen_id,))


def get_generation_file(gen_id: str) -> tuple[Path, str] | None:
    row = _fetch_row(gen_id)
    if row is None or not row["file_path"]:
        return None
    path = files.ensure_within(
        files.GENERATIONS_DIR, files.GENERATIONS_DIR / row["file_path"]
    )
    if not path.exists():
        return None
    ext = path.suffix.lstrip(".").lower()
    mime = "image/png" if ext in ("png",) else "image/jpeg" if ext in ("jpg", "jpeg") else "application/octet-stream"
    return path, mime


def record_prompt_history(prompt: str) -> None:
    if not prompt:
        return
    with connect() as conn:
        conn.execute(
            "INSERT INTO prompt_history (id, prompt, created_at) VALUES (?, ?, ?)",
            (files.new_id(), prompt, _now()),
        )
