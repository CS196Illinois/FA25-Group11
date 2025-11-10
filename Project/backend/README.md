# Backend API

FastAPI backend for the UIUC Course Recommendation System.

## Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Run the server:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

- `GET /api/majors` - Get list of all majors
- `GET /api/majors/{major_name}/courses` - Get courses for a major
- `POST /api/recommend` - Get course recommendations
- `GET /api/courses/{course_code}` - Get course details
- `GET /api/courses/{course_code}/prerequisites` - Get prerequisite chain

## Environment Variables

- `VITE_API_URL` (frontend) - Backend API URL (default: http://localhost:8000)

