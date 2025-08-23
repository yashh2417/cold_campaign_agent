from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import psycopg2
from app.core.config import settings
import logging

DATABASE_URL = settings.DB_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def connect_to_db():
    global conn, cur
    try:    
        conn = psycopg2.connect(settings.DB_URL)
        cur = conn.cursor()
        logger.info("✅ Connected to PostgreSQL DB")
    except Exception as e:
        logger.error(f"❌ PostgreSQL connection failed: {e}")
        raise

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    logger.addHandler(handler)

# Create all tables (run this once, or use Alembic for migrations)
from app.models.call_table import User, Call, Campaign, Contact

# Base.metadata.drop_all(bind=engine)

Base.metadata.create_all(bind=engine)
