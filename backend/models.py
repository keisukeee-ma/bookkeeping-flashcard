from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class QuestionResult(Base):
    __tablename__ = "question_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    question_id = Column(Integer, nullable=False)
    level = Column(String, nullable=False)
    is_correct = Column(Integer, nullable=False)  # 1=正解, 0=不正解
    created_at = Column(DateTime, server_default=func.now())
