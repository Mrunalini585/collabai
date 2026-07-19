from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(String, default="Medium")  # Low | Medium | High
    status = Column(String, default="To Do")  # To Do | In Progress | Testing | Done
    sprint = Column(String, nullable=True)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="tasks")
