"""Lightweight versioned migrations using PRAGMA user_version.

New migrations must be appended to MIGRATIONS as (version, [sql, ...]).
"""

import sqlite3

MIGRATIONS: list[tuple[int, list[str]]] = [
    # Schema v1 is created by database.init_db() itself.
]


def run_migrations(conn: sqlite3.Connection) -> None:
    current = conn.execute("PRAGMA user_version").fetchone()[0]
    for version, statements in sorted(MIGRATIONS):
        if version <= current:
            continue
        for statement in statements:
            conn.execute(statement)
        conn.execute(f"PRAGMA user_version = {version}")
