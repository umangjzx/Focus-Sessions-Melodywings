import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.database import Base, engine
from app.api import auth, tasks, sessions, analytics, achievements, settings as settings_router

# Configure logging
logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)

# Create database tables if configured
if settings.auto_create_tables:
    Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    docs_url=None if settings.disable_docs else "/api/docs",
    redoc_url=None if settings.disable_redoc else "/api/redoc",
    openapi_url=None if settings.disable_docs else "/api/openapi.json",
)

# Add security middleware (order matters: TrustedHost before CORS)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1"] if not settings.is_production else settings.cors_origin_list
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    max_age=600,
)

# Add gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Custom middleware to add security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Prevent MIME type sniffing
    if not response.headers.get("Content-Type"):
        response.headers["Content-Type"] = "application/json"
    
    return response

# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid request parameters", "errors": exc.errors()},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    if settings.is_production:
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)},
        )

# Include routers
app.include_router(auth.router, prefix="/api", tags=["authentication"])
app.include_router(tasks.router, prefix="/api", tags=["tasks"])
app.include_router(sessions.router, prefix="/api", tags=["sessions"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])
app.include_router(achievements.router, prefix="/api", tags=["achievements"])
app.include_router(settings_router.router, prefix="/api", tags=["settings"])

# Health check endpoint
@app.get("/api/health")
async def health():
    """Health check endpoint for monitoring"""
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.version,
        "environment": settings.environment
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.app_name} in {settings.environment} mode")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.app_name}")
