"""FastAPI application entry point."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(
    title="UIUC Course Recommendation API",
    description="API for course recommendations based on completed courses and major requirements",
    version="1.0.0"
)

# Configure CORS
# Get frontend URL from environment variable, default to localhost for development
import os
frontend_url = os.getenv("FRONTEND_URL", "https://illinois-course-recommender.vercel.app")

# Check if we're in development mode (default to True for local development)
environment = os.getenv("ENVIRONMENT", "development").lower()
is_development = environment != "production"

logger = logging.getLogger(__name__)
logger.info(f"Environment: {environment}, is_development: {is_development}")
logger.info(f"FRONTEND_URL: {frontend_url}")

# Build CORS origins list
cors_origins = [
    "https://illinois-course-recommender.vercel.app",
    "https://illinois-course-recommender-darshpodgmailcoms-projects.vercel.app",
]

# Add frontend URL from env if it's not already in the list
if frontend_url and frontend_url not in cors_origins:
    cors_origins.append(frontend_url)

# In development, add localhost origins
if is_development:
    cors_origins.extend([
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ])
    # Add regex pattern to match any localhost port
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    logger.info("CORS configured for development - allowing all localhost origins via regex")
else:
    # In production, only allow specific origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )
    logger.info(f"CORS configured for production - allowed origins: {cors_origins}")

# Add exception handler to ensure CORS headers are set even on errors
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to ensure CORS headers are always set."""
    import traceback
    logger = logging.getLogger(__name__)
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # Get origin from request and check if it's allowed
    origin = request.headers.get("origin")
    allowed_origin = origin if origin in cors_origins else (cors_origins[0] if cors_origins else "*")
    
    # Return error response with CORS headers
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc) if is_development else "Internal server error"},
        headers={
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """HTTP exception handler with CORS headers."""
    # Get origin from request and check if it's allowed
    origin = request.headers.get("origin")
    allowed_origin = origin if origin in cors_origins else (cors_origins[0] if cors_origins else "*")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Include API routes
app.include_router(router, prefix="/api", tags=["api"])

# Run path diagnostics on startup in production
if not is_development:
    @app.on_event("startup")
    async def startup_diagnostics():
        """Run diagnostics on startup."""
        try:
            from .services.path_diagnostics import diagnose_paths
            diagnose_paths()
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.warning(f"Could not run diagnostics: {e}")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "UIUC Course Recommendation API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

