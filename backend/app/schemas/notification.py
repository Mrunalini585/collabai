from datetime import datetime
from pydantic import BaseModel

class NotificationOut(BaseModel):
    id: int
    user_id: int
    text: str
    unread: bool
    created_at: datetime

    class Config:
        from_attributes = True
