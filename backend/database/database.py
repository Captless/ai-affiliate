"""SQLite connection handling and schema initialization."""

import sqlite3
from contextlib import contextmanager
from typing import Any, Iterator

from backend.utils.files import DATA_DIR

DB_PATH = DATA_DIR / "app.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS api_keys (
    id              TEXT PRIMARY KEY,
    label           TEXT NOT NULL,
    masked          TEXT NOT NULL,
    secret_obf      TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'untested',
    is_enabled      INTEGER NOT NULL DEFAULT 1,
    is_primary      INTEGER NOT NULL DEFAULT 0,
    last_error      TEXT,
    last_success_at TEXT,
    last_checked_at TEXT,
    balance         REAL,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reference_images (
    id         TEXT PRIMARY KEY,
    type       TEXT NOT NULL,
    filename   TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime       TEXT NOT NULL,
    size       INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_references_type ON reference_images(type);

CREATE TABLE IF NOT EXISTS generations (
    id                 TEXT PRIMARY KEY,
    status             TEXT NOT NULL,
    prompt             TEXT NOT NULL,
    aspect_ratio       TEXT,
    resolution         TEXT,
    output_format      TEXT,
    pose_id            TEXT,
    generation_style   TEXT,
    user_prompt        TEXT,
    model_reference_id TEXT,
    outfit_reference_id TEXT,
    api_key_id         TEXT,
    api_key_label      TEXT,
    wavespeed_task_id  TEXT,
    error              TEXT,
    file_path          TEXT,
    output_ext         TEXT,
    created_at         TEXT NOT NULL,
    updated_at         TEXT NOT NULL,
    completed_at       TEXT
);

CREATE INDEX IF NOT EXISTS idx_generations_created ON generations(created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prompt_history (
    id         TEXT PRIMARY KEY,
    prompt     TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as conn:
        conn.executescript(SCHEMA)


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    """Open a fresh connection per call. SQLite is cheap for a local tool."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return dict(row)
