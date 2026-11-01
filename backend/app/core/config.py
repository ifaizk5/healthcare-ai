import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "HealthLens"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "healthlens_super_secret_jwt_key_2026_change_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./healthlens.db"  # Defaults to SQLite for immediate local execution, seamlessly compatible with PostgreSQL
    )
    
    # Storage & Uploads
    UPLOAD_DIR: str = os.path.join(os.getcwd(), "uploads")
    # Project-level folders (resolved from this file so the app works from any cwd)
    PROJECT_ROOT: str = os.getenv("PROJECT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
    SAMPLE_DATA_DIR: str = os.getenv("SAMPLE_DATA_DIR", os.path.join(PROJECT_ROOT, "sample_data"))
    CONFIGS_DIR: str = os.getenv("CONFIGS_DIR", os.path.join(PROJECT_ROOT, "configs"))
    ARTIFACTS_DIR: str = os.path.join(os.getcwd(), "model_artifacts")
    
    # MLflow
    MLFLOW_TRACKING_URI: str = os.getenv("MLFLOW_TRACKING_URI", "sqlite:///./mlflow.db")
    
    class Config:
        case_sensitive = True

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.ARTIFACTS_DIR, exist_ok=True)
