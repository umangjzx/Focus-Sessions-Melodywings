"""Add due_date and sort_order to tasks and subtasks

Revision ID: add_due_date_sort_order
"""
import sqlalchemy as sa
from alembic import op

revision = "add_due_date_sort_order"
down_revision = None


def upgrade() -> None:
    # Add columns to tasks table
    with op.batch_alter_table("tasks") as batch_op:
        batch_op.add_column(sa.Column("due_date", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False))

    # Add columns to subtasks table
    with op.batch_alter_table("subtasks") as batch_op:
        batch_op.add_column(sa.Column("due_date", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False))


def downgrade() -> None:
    with op.batch_alter_table("tasks") as batch_op:
        batch_op.drop_column("due_date")
        batch_op.drop_column("sort_order")

    with op.batch_alter_table("subtasks") as batch_op:
        batch_op.drop_column("due_date")
        batch_op.drop_column("sort_order")
