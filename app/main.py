from fastapi import FastAPI,Depends
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import connect_to_db
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import connect_to_db
from app.api.routes import router as api_router
from app.api.auth_routes import router as auth_router
from app.api.call_routes import router as call_router
from app.api.campaign_routes import router as campaign_router
from app.api.contact_routes import router as contact_router
from app.core.dependencies import get_current_user
app = FastAPI(
    title="Bland AI Call",
    description="Website for creating AI-powered phone calls",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files & templates
# app.mount("/static", StaticFiles(directory="app/static"), name="static")

# DB connection
connect_to_db()

# Routers
app.include_router(auth_router)
app.include_router(contact_router, dependencies=[Depends(get_current_user)])
app.include_router(call_router, dependencies=[Depends(get_current_user)])
app.include_router(campaign_router, dependencies=[Depends(get_current_user)])
app.include_router(api_router)

# Run if main
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)