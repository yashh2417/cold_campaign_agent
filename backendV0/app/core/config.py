import os
from dotenv import load_dotenv
import google.generativeai as genai
from typing import List

load_dotenv()

class Settings:
    WEBHOOK_URL: str = os.getenv("WEBHOOK_URL")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    BLAND_API_KEY: str = os.getenv("BLAND_API_KEY")
    DB_URL: str = os.getenv("DB_URL")
    ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS").split(",")

settings = Settings()

genai.configure(api_key=settings.GEMINI_API_KEY)