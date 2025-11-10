# Setup Guide

## Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn

## Backend Setup

1. Navigate to backend directory:
```bash
cd Project/backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- API Docs: http://localhost:8000/docs

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd Project/Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Testing

### Test Backend

```bash
cd Project/backend
python3 -c "from app.services.recommender import get_recommender; r = get_recommender(); result = r.recommend_courses('Computer Science, BS', ['CS 124', 'MATH 221'], 5); print(result)"
```

### Test Frontend

1. Start backend server (port 8000)
2. Start frontend dev server (port 5173)
3. Open browser to http://localhost:5173
4. Select completed courses and get recommendations

## Project Structure

```
Project/
├── backend/              # FastAPI backend
│   └── app/
│       ├── api/         # API routes
│       ├── models/      # Data models
│       └── services/    # Business logic
├── Frontend/           # React frontend
│   └── src/
│       ├── components/  # React components
│       └── services/    # API client
└── data_scraping/       # Data pipeline
    └── output/ml_ready/ # ML-ready data
```

## Current Features

- Course recommendations for Computer Science major
- Prerequisite validation
- Degree progress tracking
- Course details view

## Next Steps

- Add more majors
- Improve recommendation algorithm
- Add semester planning
