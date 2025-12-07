# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack course recommendation system for UIUC students. It helps students plan their academic journey by providing personalized course recommendations based on completed courses and major requirements.

**Current Status**: The system supports Computer Science majors with data for 317 majors and 7,968 courses. The MVP is complete with a working FastAPI backend and React frontend.

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

The frontend uses React with a multi-screen flow:

- **`src/App.jsx`**: Main component managing application state and screen navigation
- **`src/components/`**: Reusable UI components
  - `CourseSelector.jsx`: Multi-select interface for choosing completed courses
  - `Recommendations.jsx`: Displays recommended courses with reasoning
  - `ProgressBar.jsx`: Shows degree completion percentage
  - `SemesterPlan.jsx`: Groups recommendations by semester
  - `CourseDetails.jsx`: Modal showing detailed course information
- **`src/services/api.js`**: Axios-based API client for backend communication
- **`src/utils/validation.js`**: Course code validation and normalization

**State Management**: All state lives in `App.jsx` and is passed down as props. No external state management library is used.

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

If deploying, update the `allow_origins` list in `app/main.py`.

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

The system already supports all 317 scraped majors in the data files. To use a major other than Computer Science:

1. Ensure the major data exists in `Project/data_scraping/output/ml_ready/major_requirements.json`
2. Update `MAJOR_NAME` constant in `src/App.jsx`
3. Optionally add sample sequence data to `sample_sequences.json`

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
│   │   └── requirements.txt
│   ├── Frontend/              # React frontend
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── services/     # API client
│   │   │   ├── utils/        # Validation
│   │   │   └── App.jsx       # Main component
│   │   ├── package.json
│   │   └── vite.config.js
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

## Important Notes

### Data File Dependencies

The backend expects data files in `Project/data_scraping/output/ml_ready/`:
- `course_graph.json` (required)
- `major_requirements.json` (required)
- `sample_sequences.json` (optional, enables semester planning)

If these files are missing, the backend will fail to start. Run the data scraping pipeline to generate them.

### API Error Handling

The backend uses HTTPException for all errors with appropriate status codes:
- 404: Resource not found (major, course)
- 400: Invalid input (validation errors)
- 500: Internal server errors

Frontend displays user-friendly error messages from API responses.

### Testing Strategy

Current testing is manual:
1. Start backend and check health endpoint: `curl http://localhost:8000/health`
2. Test API endpoints via Swagger UI: `http://localhost:8000/docs`
3. Test frontend flow: Select courses → Get recommendations → View details

No automated test suite exists yet. Consider adding pytest for backend and Jest for frontend.

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
