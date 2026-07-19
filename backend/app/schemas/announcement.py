from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class AnnouncementCreate(BaseModel):
    title: str
    content: str

class AnnouncementOut(BaseModel):
    id: int
    project_id: int
    user_id: int
    title: str
    content: str
    created_at: datetime
    author_name: Optional[str] = None

    class Config:
        from_attributes = True
