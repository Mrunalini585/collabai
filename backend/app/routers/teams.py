from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.models.project import TeamMember
from app.models.user import User
from app.schemas.auth import UserOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/projects/{project_id}/team", tags=["teams"])


class InviteRequest(BaseModel):
    email: EmailStr
    role_in_team: str = "member"


@router.get("/", response_model=List[UserOut])
def list_members(project_id: int, db: Session = Depends(get_db)):
    member_ids = [m.user_id for m in db.query(TeamMember).filter(TeamMember.project_id == project_id)]
    return db.query(User).filter(User.id.in_(member_ids)).all()


@router.post("/invite")
def invite_member(project_id: int, payload: InviteRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No CollabAI user found with that email. They must sign up first.")
    existing = db.query(TeamMember).filter(TeamMember.project_id == project_id, TeamMember.user_id == user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a team member")
    db.add(TeamMember(project_id=project_id, user_id=user.id, role_in_team=payload.role_in_team))
    db.commit()
    return {"message": f"{user.name} added to the project"}
