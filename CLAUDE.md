# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack course recommendation system for UIUC students. It helps students plan their academic journey by providing personalized course recommendations based on completed courses and major requirements.

**Current Status**: The system supports 317 majors and 7,968 courses. The full-stack application is complete with:
- FastAPI backend deployed on Railway
- React frontend deployed on Vercel
- Multi-step onboarding flow with API integration
- Real-time course recommendations (technical courses, GenEd courses, and clubs)
- Combined recommendations endpoint for unified results
- Automated testing infrastructure (pytest for backend, vitest for frontend)

## Development Commands

### Backend (FastAPI)

```bash
# Setup
cd Project/backend
pip install -r requirements.txt

# Run development server
cd Project/backend
uvicorn app.main:app --reload --port 8000

# Access API documentation
# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

### Frontend (React + Vite)

```bash
# Setup
cd Project/Frontend
npm install

# Run development server
npm run dev
# Frontend will be available at http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Data Scraping Pipeline

The data scraping scripts must be run in this specific order:

```bash
cd Project/data_scraping/scripts

# 1. Scrape all courses (creates raw_data/all_courses.csv)
python scrape_all_courses.py

# 2. Scrape all majors (creates raw_data/majors/*.json)
python scrape_all_majors.py

# 3. Parse prerequisites (creates output/processed/courses_with_prereqs.json)
python parse_prerequisites.py

# 4. Parse major requirements (creates output/processed/majors_structured.json)
python parse_requirements.py

# 5. Align majors with courses (creates output/processed/major_course_alignments.json)
python align_majors_courses.py

# 6. Build ML-ready data (creates output/ml_ready/*.json)
python build_ml_data.py

# Optional: Monitor scraping progress
python monitor_scrape.py
```

## Architecture

### Backend Structure

The backend follows a clean architecture pattern:

- **`app/main.py`**: FastAPI application entry point with CORS configuration
- **`app/api/routes.py`**: API endpoint definitions and request/response handling
- **`app/services/`**: Business logic layer
  - `data_loader.py`: Singleton that loads and caches course graph and major requirements from JSON files
  - `recommender.py`: Rule-based recommendation engine that ranks courses by priority
  - `prereq_checker.py`: Validates whether prerequisites are met (handles OR logic)
  - `year_detector.py`: Detects student year based on completed courses
- **`app/models/`**: Pydantic models for request/response validation
- **`app/utils/`**: Validation utilities for course codes

**Data Flow**: The backend uses a singleton pattern for data loading. On startup, `DataLoader` loads JSON files from `Project/data_scraping/output/ml_ready/` and caches them in memory for fast access.

### Frontend Structure

The frontend uses React with a modern multi-page flow and API integration:

- **`src/App.jsx`**: Main app component with React Router and AppContextProvider
- **`src/pages/`**: Page components
  - `LandingPage.jsx`: Marketing landing page with hero section and features
  - `OnboardingPage.jsx`: Multi-step onboarding flow (6 steps: welcome, major, year, courses, interests, review)
  - `RecommendationsPage.jsx`: Displays course recommendations with filtering and progress info
- **`src/context/AppContext.jsx`**: React Context for global state management (formData, recommendations, loading, error)
- **`src/services/api.js`**: Axios-based API client with error handling and timeout configuration
  - Functions: `getMajors()`, `getMajorCourses()`, `getRecommendations()`, `getCourseDetails()`, `uploadDars()`
- **`src/utils/validation.js`**: Course code validation and normalization (if needed)

**State Management**: Uses React Context (`AppContext`) to share state between onboarding and recommendations pages, avoiding prop drilling.

**API Integration**: All API calls go through the centralized `api.js` service layer. The API base URL is configured via `VITE_API_URL` environment variable (defaults to `http://localhost:8000`).

**Combined Recommendations**: The frontend now uses the `/api/recommend/combined` endpoint which provides:
- Technical course recommendations (based on major and prerequisites)
- GenEd course recommendations (based on interests and GPA preferences)
- Club recommendations (based on interests and tags)
The RecommendationsPage displays these in separate tabs for easy navigation.

### Data Pipeline Architecture

The data pipeline transforms raw scraped data into an ML-ready graph structure:

1. **Raw scraping**: Fetches courses and majors from UIUC catalog
2. **Prerequisite parsing**: Extracts prerequisite relationships using regex patterns
3. **Requirement parsing**: Structures major requirements into groups
4. **Alignment**: Validates that all major courses exist in course catalog
5. **Graph construction**: Builds NetworkX graph with prerequisite/postrequisite edges

**Output Format**: Final data is stored in `Project/data_scraping/output/ml_ready/`:
- `course_graph.json`: Graph structure with nodes (courses) and edges (prerequisites)
- `major_requirements.json`: Structured major requirements grouped by category
- `sample_sequences.json`: Example semester-by-semester plans for majors

### Recommendation Algorithm

The recommender uses a rule-based priority ranking system:

1. **Prerequisite checking**: Filters to courses where all prerequisites are met
2. **Sequence alignment**: Prioritizes courses from sample semester sequences
3. **Required courses**: Prioritizes required major courses over electives
4. **Course level**: Prioritizes lower-level courses (100/200) before upper-level (300/400)
5. **Postrequisite count**: Ranks courses that unlock more downstream courses higher

**Student year detection**: The system infers student year (freshman/sophomore/junior/senior) based on the number and level of completed courses, then uses this to align recommendations with sample sequences.

## Key Technical Details

### Course Code Normalization

All course codes are normalized to "DEPT NUM" format (e.g., "CS 124"). The backend handles various input formats:
- "CS124" → "CS 124"
- "cs 124" → "CS 124"
- "CS-124" → "CS 124"

Validation happens in both frontend and backend for defense in depth.

### Prerequisite Logic

Prerequisites support OR logic (e.g., "CS 173 or MATH 213"). The `prereq_checker.py` handles this by checking if ANY option in an OR group is satisfied.

### CORS Configuration

The backend allows requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (Alternative React port)
- `http://127.0.0.1:5173` (Alternative localhost)
- `https://illinois-course-recommender.vercel.app` (Production Vercel frontend)
- `https://illinois-course-recommender-darshpodgmailcoms-projects.vercel.app` (Alternative Vercel domain)

CORS configuration is in `app/main.py` and includes both development and production URLs. The frontend URL can also be set via the `FRONTEND_URL` environment variable.

### Data Loading Performance

The singleton pattern in `data_loader.py` ensures data is loaded only once per application lifecycle. Course lookups are O(1) via dictionary mapping.

## Common Development Patterns

### Adding a New API Endpoint

1. Add route handler in `app/api/routes.py`
2. Define Pydantic models for request/response in `app/models/`
3. Implement business logic in appropriate service (`app/services/`)
4. Update frontend API client in `src/services/api.js`
5. Create or update React component to consume the endpoint

### Adding a New Major

The system already supports all 317 scraped majors in the data files. The frontend now fetches majors dynamically from the API:

1. Ensure the major data exists in `Project/data_scraping/output/ml_ready/major_requirements.json`
2. The `MajorStep` component in `OnboardingPage.jsx` automatically loads all available majors from `/api/majors`
3. Optionally add sample sequence data to `sample_sequences.json` for better recommendations

### Modifying Recommendation Logic

The recommendation algorithm is in `app/services/recommender.py`:
- `recommend_courses()`: Main entry point
- Priority ranking is controlled by the `sort()` key function (line ~186)
- Filtering logic for course level appropriateness is in `is_appropriate_level()` (line ~167)

## Project Organization

```
FA25-Group11/
├── Docs/                       # Course deliverables
│   ├── PLAN.md                # Project plan
│   └── RUN.md                 # Run instructions (minimal)
├── Project/                    # Main project directory
│   ├── backend/               # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/          # Route handlers
│   │   │   ├── models/       # Pydantic models
│   │   │   ├── services/     # Business logic
│   │   │   ├── utils/        # Validation
│   │   │   └── main.py       # App entry point
│   │   ├── requirements.txt
│   │   └── Procfile          # Railway deployment config
│   ├── Frontend/              # React frontend
│   │   ├── src/
│   │   │   ├── pages/        # Page components
│   │   │   │   ├── LandingPage.jsx
│   │   │   │   ├── OnboardingPage.jsx
│   │   │   │   └── RecommendationsPage.jsx
│   │   │   ├── context/      # React Context
│   │   │   │   └── AppContext.jsx
│   │   │   ├── services/     # API client
│   │   │   │   └── api.js
│   │   │   ├── utils/        # Validation
│   │   │   └── App.jsx       # Main app with routing
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── vercel.json       # Vercel deployment config
│   ├── data_scraping/         # Data pipeline
│   │   ├── scripts/          # Processing scripts
│   │   ├── raw_data/         # Scraped raw data
│   │   └── output/
│   │       ├── processed/    # Intermediate data
│   │       └── ml_ready/     # Final graph data
│   ├── Model/                 # ML model experiments
│   └── docs/                  # Project documentation
└── README.md                  # Project overview
```

## Environment Variables

### Development Setup

Copy `.env.example` files to `.env` in each directory:

**Frontend** (`Project/Frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
```

**Backend** (`Project/backend/.env`):
```env
ENVIRONMENT=development
DATA_DIR=
FRONTEND_URL=
PORT=8000
```

See `.env.example` files for detailed documentation of each variable.

## Deployment

### Railway (Backend)

The backend is configured for Railway deployment:

1. **Procfile**: Located at `Project/backend/Procfile`
   - Command: `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Railway automatically provides the `$PORT` environment variable

2. **Data Files**: Ensure data files are accessible in Railway:
   - Default location: `Project/data_scraping/output/ml_ready/`
   - Can be overridden with `DATA_DIR` environment variable
   - DataLoader includes fallback paths for different deployment scenarios
   - Logs data directory path on startup for debugging

3. **Environment Variables**:
   - `PORT`: Automatically set by Railway
   - `DATA_DIR`: Optional, path to data files directory
   - `FRONTEND_URL`: Optional, frontend URL for CORS (defaults to Vercel URL)

4. **Deployment Steps**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize project (if not already done)
   cd Project/backend
   railway init
   
   # Deploy
   railway up
   ```

### Vercel (Frontend)

The frontend is deployed on Vercel:

1. **Configuration**: `Project/Frontend/vercel.json` handles routing and build settings
2. **Environment Variables**: Set `VITE_API_URL` in Vercel dashboard to point to Railway backend
3. **Deployment**: Automatic on git push, or manual via `vercel --prod`

**Production URLs**:
- Frontend: https://illinois-course-recommender.vercel.app
- Backend: https://vigilant-exploration-production.up.railway.app

### Environment Variables Reference

**Frontend**:
- `VITE_API_URL`: Backend API base URL (default: `http://localhost:8000`)
  - Development: `http://localhost:8000`
  - Production: Railway backend URL (e.g., `https://your-app.railway.app`)

**Backend**:
- `PORT`: Server port (automatically set by Railway)
- `ENVIRONMENT`: Set to `production` for production CORS settings (defaults to development)
- `DATA_DIR`: Path to data files directory (optional, has defaults)
- `FRONTEND_URL`: Frontend URL for CORS configuration (optional, defaults to Vercel URL)

See `Project/docs/DEPLOYMENT.md` for detailed deployment instructions.

## Testing

### Running Tests

**Backend Tests**:
```bash
cd Project/backend
pytest
# Or with verbose output:
pytest -v
```

**Frontend Tests**:
```bash
cd Project/Frontend
npm test
# Or with UI:
npm run test:ui
# Or with coverage:
npm run test:coverage
```

### Test Coverage

Current test suite includes:
- Health check endpoint validation
- Majors endpoint functionality
- Recommendation endpoint validation
- Combined recommendations endpoint
- API service function mocking
- Basic component rendering

Tests are designed to be fast (< 30 seconds total) and focus on critical integration points.

## Important Notes

### Data File Dependencies

The backend expects data files in `Project/data_scraping/output/ml_ready/`:
- `course_graph.json` (required)
- `major_requirements.json` (required)
- `sample_sequences.json` (optional, enables semester planning)

If these files are missing, the backend will fail to start. Run the data scraping pipeline to generate them.

**Railway Deployment**: The `DataLoader` class includes:
- Environment variable support (`DATA_DIR`)
- Multiple fallback path checks
- Detailed logging for debugging path issues
- Error messages that include the attempted data directory path

### API Error Handling

The backend uses HTTPException for all errors with appropriate status codes:
- 404: Resource not found (major, course)
- 400: Invalid input (validation errors)
- 500: Internal server errors

Frontend displays user-friendly error messages from API responses.

### Testing Strategy

The project now includes automated testing infrastructure:

**Backend Tests (pytest)**:
- Location: `Project/backend/tests/`
- Run tests: `cd Project/backend && pytest`
- Test files:
  - `test_health.py` - Health check endpoint tests
  - `test_majors.py` - Majors endpoint tests
  - `test_recommendations.py` - Recommendation endpoint tests
  - `conftest.py` - Pytest fixtures and test client setup
- Configuration: `pytest.ini`

**Frontend Tests (vitest)**:
- Location: `Project/Frontend/src/__tests__/`
- Run tests: `cd Project/Frontend && npm test`
- Test files:
  - `api.test.js` - API service function tests
  - `App.test.jsx` - Basic component tests
  - `setup.js` - Test configuration
- Configuration: `vitest.config.js`

**Manual Testing**:
1. Start backend and check health endpoint: `curl http://localhost:8000/health`
2. Test API endpoints via Swagger UI: `http://localhost:8000/docs`
3. Test frontend flow: Select courses → Get recommendations → View details
4. Test combined recommendations: Verify GenEd and club recommendations appear

### Performance Considerations

- Course graph loads ~8K courses into memory (~50MB)
- Recommendation generation is fast (<100ms) due to in-memory data
- Frontend loads all major courses on mount (may be slow for large majors)
- Consider pagination or lazy loading for majors with >500 courses

## Git Workflow

The repository uses a simple main branch workflow:
- Main branch: `master`
- All development happens directly on master or feature branches
- Recent commits focus on typo fixes and club recommender features
