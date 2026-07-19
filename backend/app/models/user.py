from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # student | team_leader | faculty | admin
    role = Column(String, default="student", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    memberships = relationship("TeamMember", back_populates="user")
