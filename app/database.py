import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

# Ensure the data folder exists
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DB_DIR, exist_ok=True)

DB_PATH = os.path.join(DB_DIR, "programs.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Engine and session
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def run_migrations(eng):
    """Add columns introduced after initial schema creation."""
    with eng.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE programs ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT 0"))
            conn.commit()
        except Exception:
            pass  # column already exists
