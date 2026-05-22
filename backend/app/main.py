from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.core.migrate import run_migrations

from app.api import (
    auth,
    tasks,
    sessions,
    analytics,
    achievements,
    meetings,
    settings as settings_router,
)

# Create / migrate database tables automatically
if settings.auto_create_tables:
    run_migrations()

# FastAPI App
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response Compression
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,
)

# Authentication Routes
app.include_router(auth.router)

# Task Management Routes
app.include_router(tasks.router)

# Focus Session Routes
app.include_router(sessions.router)

# Analytics Routes
app.include_router(analytics.router)

# Achievement Routes
app.include_router(achievements.router)

# User Settings Routes
app.include_router(settings_router.router)

# Group Focus Session / Meetings Routes
app.include_router(
    meetings.router,
    prefix="/api/meetings",
    tags=["Meetings"],
)

# Root Endpoint
@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Focus Sessions API Running",
        "version": "1.0.0",
        "status": "success",
    }

# Health Check Endpoint
@app.get("/api/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": "1.0.0",
    }

import socketio
from app.api.sockets import sio

app = socketio.ASGIApp(sio, other_asgi_app=app)