"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-07-18

"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("email", sa.String, nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String, nullable=False),
        sa.Column("role", sa.String, nullable=False, server_default="student"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "projects",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("description", sa.Text, server_default=""),
        sa.Column("owner_id", sa.Integer, sa.ForeignKey("users.id")),
        sa.Column("github_repo", sa.String, server_default=""),
        sa.Column("deadline", sa.Date, nullable=True),
        sa.Column("risk_level", sa.String, server_default="Low"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "team_members",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("project_id", sa.Integer, sa.ForeignKey("projects.id")),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id")),
        sa.Column("role_in_team", sa.String, server_default="member"),
    )

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("project_id", sa.Integer, sa.ForeignKey("projects.id")),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("description", sa.Text, server_default=""),
        sa.Column("assignee_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("priority", sa.String, server_default="Medium"),
        sa.Column("status", sa.String, server_default="To Do"),
        sa.Column("sprint", sa.String, nullable=True),
        sa.Column("due_date", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "meetings",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("project_id", sa.Integer, sa.ForeignKey("projects.id")),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True)),
        sa.Column("summary", sa.Text, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("meetings")
    op.drop_table("tasks")
    op.drop_table("team_members")
    op.drop_table("projects")
    op.drop_table("users")
