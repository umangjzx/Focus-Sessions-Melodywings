from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("reset_token", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("estimated_minutes", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("tags", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_tasks_user_id", "tasks", ["user_id"], unique=False)

    op.create_table(
        "subtasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("estimated_minutes", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("tags", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_subtasks_user_id", "subtasks", ["user_id"], unique=False)
    op.create_index("ix_subtasks_task_id", "subtasks", ["task_id"], unique=False)

    op.create_table(
        "focus_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("goal", sa.Text(), nullable=True),
        sa.Column("planned_minutes", sa.Integer(), nullable=False),
        sa.Column("actual_minutes", sa.Integer(), nullable=False),
        sa.Column("pauses", sa.Integer(), nullable=False),
        sa.Column("ambient_sound", sa.String(length=80), nullable=True),
        sa.Column("pomodoro_work", sa.Integer(), nullable=True),
        sa.Column("pomodoro_break", sa.Integer(), nullable=True),
        sa.Column("productivity_score", sa.Float(), nullable=False),
        sa.Column("mood", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("xp_earned", sa.Integer(), nullable=False),
        sa.Column("task_completed", sa.Boolean(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_focus_sessions_user_id", "focus_sessions", ["user_id"], unique=False)

    op.create_table(
        "session_notes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["focus_sessions.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_session_notes_user_id", "session_notes", ["user_id"], unique=False)
    op.create_index("ix_session_notes_session_id", "session_notes", ["session_id"], unique=False)

    op.create_table(
        "streaks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("current_streak", sa.Integer(), nullable=False),
        sa.Column("longest_streak", sa.Integer(), nullable=False),
        sa.Column("last_focus_date", sa.Date(), nullable=True),
        sa.Column("total_xp", sa.Integer(), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", name="uq_streak_user"),
    )

    op.create_table(
        "achievements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("badge_name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("earned_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "badge_name", name="uq_user_badge"),
    )

    op.create_table(
        "settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("default_duration", sa.Integer(), nullable=False),
        sa.Column("theme", sa.String(length=30), nullable=False),
        sa.Column("notifications_enabled", sa.Boolean(), nullable=False),
        sa.Column("auto_start_breaks", sa.Boolean(), nullable=False),
        sa.Column("preferred_sound", sa.String(length=80), nullable=True),
        sa.Column("sound_volume", sa.Integer(), nullable=False),
        sa.Column("pomodoro_work", sa.Integer(), nullable=False),
        sa.Column("pomodoro_break", sa.Integer(), nullable=False),
        sa.Column("ai_coach_enabled", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", name="uq_settings_user"),
    )


def downgrade() -> None:
    op.drop_table("settings")
    op.drop_table("achievements")
    op.drop_table("streaks")
    op.drop_index("ix_session_notes_session_id", table_name="session_notes")
    op.drop_index("ix_session_notes_user_id", table_name="session_notes")
    op.drop_table("session_notes")
    op.drop_index("ix_focus_sessions_user_id", table_name="focus_sessions")
    op.drop_table("focus_sessions")
    op.drop_index("ix_subtasks_task_id", table_name="subtasks")
    op.drop_index("ix_subtasks_user_id", table_name="subtasks")
    op.drop_table("subtasks")
    op.drop_index("ix_tasks_user_id", table_name="tasks")
    op.drop_table("tasks")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
