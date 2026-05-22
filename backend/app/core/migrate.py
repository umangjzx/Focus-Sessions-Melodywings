"""Lightweight SQLite migrations for dev databases created before model updates."""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.core.database import Base, engine

# Import all models so metadata is complete for create_all
import app.models  # noqa: F401


def _sqlite_columns(conn, table: str) -> set[str]:
    rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {row[1] for row in rows}


def _add_column_if_missing(conn, table: str, column: str, ddl: str) -> None:
    if column not in _sqlite_columns(conn, table):
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {ddl}"))


def run_migrations(db_engine: Engine = engine) -> None:
    """Create missing tables and add columns introduced after initial DB creation."""
    Base.metadata.create_all(bind=db_engine)

    if not str(db_engine.url).startswith("sqlite"):
        return

    with db_engine.begin() as conn:
        tables = _sqlite_columns(conn, "meetings") if "meetings" in inspect(db_engine).get_table_names() else set()

        if tables:
            _add_column_if_missing(
                conn, "meetings", "meeting_start_time", "meeting_start_time DATETIME"
            )
            _add_column_if_missing(
                conn, "meetings", "meeting_duration", "meeting_duration INTEGER"
            )
            _add_column_if_missing(
                conn, "meetings", "remaining_time", "remaining_time INTEGER"
            )

        if "meeting_participants" in inspect(db_engine).get_table_names():
            _add_column_if_missing(
                conn,
                "meeting_participants",
                "is_ready",
                "is_ready BOOLEAN DEFAULT 0",
            )
