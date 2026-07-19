from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.announcement import Announcement
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate, AnnouncementOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/projects/{project_id}/announcements", tags=["announcements"])

@router.get("/", response_model=List[AnnouncementOut])
def list_announcements(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    announcements = db.query(Announcement).filter(Announcement.project_id == project_id).order_by(Announcement.created_at.desc()).all()
    out = []
    for a in announcements:
        author = db.query(User).filter(User.id == a.user_id).first()
        author_name = author.name if author else "Unknown User"
        out.append(AnnouncementOut(
            id=a.id,
            project_id=a.project_id,
            user_id=a.user_id,
            title=a.title,
            content=a.content,
            created_at=a.created_at,
            author_name=author_name
        ))
    return out

@router.post("/", response_model=AnnouncementOut)
def create_announcement(project_id: int, payload: AnnouncementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["team_leader", "faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only team leaders and faculty can post announcements")
    a = Announcement(
        project_id=project_id,
        user_id=current_user.id,
        title=payload.title,
        content=payload.content
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return AnnouncementOut(
        id=a.id,
        project_id=a.project_id,
        user_id=a.user_id,
        title=a.title,
        content=a.content,
        created_at=a.created_at,
        author_name=current_user.name
    )
