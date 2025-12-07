"""FastAPI application entry point."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router
from .services.recommender import get_recommender
from .services.technical_recommender import get_technical_recommender
from .services.gened_recommender import get_gened_recommender
from .services.club_recommender import get_club_recommender

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api", tags=["api"])


@app.on_event("startup")
async def _preload_singletons():
    """Preload heavy singletons (recommenders) on startup to avoid first-request delays."""
    import logging
    import asyncio
    import time

    logger = logging.getLogger(__name__)
    logger.info("=" * 60)
    logger.info("STARTUP: Preloading recommender singletons and data...")
    logger.info("=" * 60)
    start_time = time.time()

    try:
        loop = asyncio.get_running_loop()
        
        # Define warmup functions that create singleton AND load all data
        def warmup_recommender():
            logger.info("[Startup] Initializing base recommender...")
            recommender = get_recommender()
            logger.info("[Startup] Base recommender initialized")
            return recommender
        
        def warmup_technical():
            logger.info("[Startup] Initializing technical recommender...")
            recommender = get_technical_recommender()
            recommender.warmup()
            return recommender
        
        def warmup_gened():
            logger.info("[Startup] Initializing gened recommender...")
            recommender = get_gened_recommender()
            recommender.warmup()
            return recommender
        
        def warmup_club():
            logger.info("[Startup] Initializing club recommender...")
            recommender = get_club_recommender()
            recommender.warmup()
            return recommender
        
        # Run all warmups in parallel to speed up startup
        logger.info("[Startup] Running all warmups in parallel...")
        await asyncio.gather(
            loop.run_in_executor(None, warmup_recommender),
            loop.run_in_executor(None, warmup_technical),
            loop.run_in_executor(None, warmup_gened),
            loop.run_in_executor(None, warmup_club),
        )
        
        total_time = time.time() - start_time
        logger.info("=" * 60)
        logger.info(f"STARTUP COMPLETE: All recommenders loaded in {total_time:.2f}s")
        logger.info("=" * 60)
    except Exception as e:
        logger.exception("Error preloading recommender singletons: %s", e)


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

