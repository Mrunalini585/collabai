from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    github_repo: str = ""
    deadline: Optional[date] = None


class ProjectOut(BaseModel):
    id: int
    name: str
    description: str
    github_repo: str
    deadline: Optional[date]
    risk_level: str
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True
