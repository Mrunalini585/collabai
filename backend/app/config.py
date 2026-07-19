from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://collabai:collabai@localhost:5432/collabai"
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "collabai"

    jwt_secret: str = "change-me-super-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    ai_provider: str = "openai"  # "openai" or "gemini"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-pro"

    github_token: str = ""
    github_repo: str = ""

    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
