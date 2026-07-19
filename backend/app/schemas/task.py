from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    assignee_id: Optional[int] = None
    priority: str = "Medium"
    status: str = "To Do"
    sprint: Optional[str] = None
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    sprint: Optional[str] = None
    due_date: Optional[date] = None


class TaskOut(BaseModel):
    id: int
    project_id: int
    title: str
    description: str
    assignee_id: Optional[int]
    priority: str
    status: str
    sprint: Optional[str]
    due_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True


class TaskCommentCreate(BaseModel):
    content: str


class TaskCommentOut(BaseModel):
    id: int
    task_id: int
    user_id: int
    content: str
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

