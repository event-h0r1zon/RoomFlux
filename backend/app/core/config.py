from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    BFL_API_KEY: str
    FLUX_API_URL: str = "https://api.bfl.ai/v1/flux-kontext-pro"
    
    SUPABASE_URL: str
    SUPABASE_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
