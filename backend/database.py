import os
from datetime import datetime
from typing import Optional
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables (.env in root or backend/.env)
root_env = Path(__file__).resolve().parent.parent / ".env"
backend_env = Path(__file__).resolve().parent / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
load_dotenv()

# Determine default database path (use /tmp on Vercel serverless)
is_vercel = bool(os.getenv("VERCEL"))
default_db = "sqlite:////tmp/neuroforge.db" if is_vercel else "sqlite:///./neuroforge.db"

DATABASE_URL = os.getenv("DATABASE_URL", default_db)

# Attempt connection to Postgres, fallback smoothly to SQLite if unreachable
try:
    if DATABASE_URL.startswith("postgresql"):
        temp_engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3})
        with temp_engine.connect() as conn:
            pass
        engine = temp_engine
    else:
        connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
        engine = create_engine(DATABASE_URL, connect_args=connect_args)
except Exception as e:
    import tempfile
    print(f"Primary database connection not ready ({e}). Falling back to SQLite database.")
    if is_vercel:
        DATABASE_URL = "sqlite:////tmp/neuroforge.db"
    else:
        temp_dir = tempfile.gettempdir()
        db_file = Path(temp_dir) / "neuroforge.db"
        DATABASE_URL = f"sqlite:///{db_file.as_posix()}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    projects = relationship("Project", back_populates="owner")
    api_keys = relationship("APIKey", back_populates="user")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    datasets = relationship("Dataset", back_populates="project", cascade="all, delete-orphan")

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    source_type = Column(String) # 'CSV' or 'URL'
    source_metadata = Column(JSON, nullable=True)
    review_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="datasets")
    reviews = relationship("Review", back_populates="dataset", cascade="all, delete-orphan")
    analysis = relationship("AnalysisResult", back_populates="dataset", uselist=False, cascade="all, delete-orphan")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    text = Column(Text, nullable=False)
    rating = Column(Float, nullable=True)
    sentiment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="reviews")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    metrics = Column(JSON, nullable=False) # Stores sentiment %, topics, etc.
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="analysis")

class APIKey(Base):
    __tablename__ = "api_keys"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key_hash = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    scopes = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="api_keys")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    status = Column(String, default="QUEUED") # QUEUED, PROCESSING, COMPLETED, FAILED
    result_id = Column(Integer, ForeignKey("analysis_results.id"), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WebhookSubscription(Base):
    __tablename__ = "webhook_subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_url = Column(String, nullable=False)
    secret = Column(String, nullable=False) # For HMAC signatures
    events = Column(JSON, nullable=False) # List of events: ["analysis.completed", etc]
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
