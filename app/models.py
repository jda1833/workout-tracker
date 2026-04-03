from sqlalchemy import Column, Integer, JSON
from .database import Base


class Program(Base):
    __tablename__ = "programs"
    id = Column(Integer, primary_key=True, index=True)
    week = Column(Integer, index=True, unique=True)
    json_data = Column(JSON)
