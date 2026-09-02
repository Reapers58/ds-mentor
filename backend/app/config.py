from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "DS-Mentor"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5433/dsmentor"
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5433/dsmentor"

    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "sop_docs"

    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"

    embedding_model: str = "all-MiniLM-L6-v2"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    redis_url: str = "redis://localhost:6379/0"

    allowed_roles: list[str] = ["developer", "qa", "pm", "devops", "po", "admin"]

    class Config:
        env_file = ".env"


settings = Settings()
