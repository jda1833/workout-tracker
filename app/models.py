from sqlalchemy import Column, Integer, JSON, Boolean, String
from .database import Base


class Program(Base):
    __tablename__ = "programs"
    id = Column(Integer, primary_key=True, index=True)
    week = Column(Integer, index=True, unique=True)
    json_data = Column(JSON)
    deleted = Column(Boolean, default=False, nullable=False)


class CheckIn(Base):
    __tablename__ = "checkins"
    id = Column(Integer, primary_key=True, index=True)
    week = Column(Integer, index=True, unique=True)
    json_data = Column(JSON)


class ExerciseNote(Base):
    __tablename__ = "exercise_notes"
    id = Column(Integer, primary_key=True, index=True)
    exercise_name = Column(String, unique=True, index=True, nullable=False)
    note = Column(String(100), nullable=False, default="")
