from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String, nullable=False)
    scheduled_at = Column(DateTime(timezone=True))
    summary = Column(Text, default="")  # AI-generated summary, cached
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="meetings")
