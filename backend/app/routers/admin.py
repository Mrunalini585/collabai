from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.core.deps import require_role

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
def stats(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    total_users = db.query(func.count(User.id)).scalar()
    total_projects = db.query(func.count(Project.id)).scalar()
    total_tasks = db.query(func.count(Task.id)).scalar()
    tasks_done = db.query(func.count(Task.id)).filter(Task.status == "Done").scalar()
    tasks_in_progress = db.query(func.count(Task.id)).filter(Task.status == "In Progress").scalar()

    # Role breakdown
    role_counts = {}
    for role in ["student", "team_leader", "faculty", "admin"]:
        role_counts[role] = db.query(func.count(User.id)).filter(User.role == role).scalar()

    # Recent users (last 5)
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()

    # Recent projects (last 5)
    recent_projects = db.query(Project).order_by(Project.created_at.desc()).limit(5).all()

    return {
        "total_users": total_users,
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "tasks_done": tasks_done,
        "tasks_in_progress": tasks_in_progress,
        "role_breakdown": role_counts,
        "recent_users": [
            {"id": u.id, "name": u.name, "email": u.email, "role": u.role}
            for u in recent_users
        ],
        "recent_projects": [
            {"id": p.id, "name": p.name, "risk_level": p.risk_level, "created_at": str(p.created_at)}
            for p in recent_projects
        ],
    }
