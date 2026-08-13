"""Dataclasses for backend domain records."""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class GenerationRecord:
    id: str
    status: str
    prompt: str
    aspect_ratio: str | None = None
    resolution: str | None = None
    output_format: str | None = None
    pose_id: str | None = None
    generation_style: str | None = None
    user_prompt: str | None = None
    model_reference_id: str | None = None
    outfit_reference_id: str | None = None
    api_key_id: str | None = None
    api_key_label: str | None = None
    wavespeed_task_id: str | None = None
    error: str | None = None
    file_path: str | None = None
    output_ext: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    completed_at: str | None = None

    def to_dict(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "id": self.id,
            "status": self.status,
            "prompt": self.prompt,
            "aspect_ratio": self.aspect_ratio,
            "resolution": self.resolution,
            "output_format": self.output_format,
            "pose_id": self.pose_id,
            "generation_style": self.generation_style,
            "user_prompt": self.user_prompt,
            "model_reference_id": self.model_reference_id,
            "outfit_reference_id": self.outfit_reference_id,
            "api_key_id": self.api_key_id,
            "api_key_label": self.api_key_label,
            "wavespeed_task_id": self.wavespeed_task_id,
            "error": self.error,
            "file_path": self.file_path,
            "output_ext": self.output_ext,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "completed_at": self.completed_at,
        }
        return data
