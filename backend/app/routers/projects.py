from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.project import Project, TeamMember
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    github_repo: Optional[str] = None
    deadline: Optional[date] = None


@router.post("/", response_model=ProjectOut)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = Project(**payload.model_dump(), owner_id=user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    # Owner automatically becomes team leader on the project.
    db.add(TeamMember(project_id=project.id, user_id=user.id, role_in_team="leader"))
    db.commit()
    return project


@router.get("/", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project_ids = [m.project_id for m in db.query(TeamMember).filter(TeamMember.user_id == user.id)]
    return db.query(Project).filter(Project.id.in_(project_ids)).all()


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can edit it")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can delete it")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


@router.get("/{project_id}/chat")
def get_chat_history(project_id: int, _=Depends(get_current_user)):
    from app.database import chat_collection
    messages = chat_collection.find({"project_id": project_id})
    results = []
    for m in messages:
        results.append({
            "project_id": m.get("project_id"),
            "user": m.get("user"),
            "text": m.get("text"),
            "ts": m.get("ts")
        })
    return results

