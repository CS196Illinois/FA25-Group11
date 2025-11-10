# System Architecture

## Overview

The UIUC Course Recommendation System is a full-stack application that helps students plan their academic journey by recommending courses based on completed courses and major requirements.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Components  │  │   Services   │  │    Utils     │     │
│  │              │  │   (API)      │  │ (Validation) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Routes    │  │   Services   │  │    Models   │     │
│  │   (API)      │  │ (Business)   │  │  (Pydantic) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                            │                               │
│  ┌──────────────┐          │                               │
│  │    Utils     │          │                               │
│  │(Validation)  │          │                               │
│  └──────────────┘          │                               │
└────────────────────────────┼───────────────────────────┘
                              │
                              │ File I/O
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  course_graph.json (7,968 courses)                 │    │
│  │  major_requirements.json (317 majors)              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Frontend (React)

**Components:**
- `App.jsx` - Main application with screen routing
- `CourseSelector` - Course selection interface with search/filter
- `Recommendations` - Display recommended courses
- `ProgressBar` - Degree progress visualization
- `CourseDetails` - Modal with course information

**Services:**
- `api.js` - Axios-based API client with error handling

**Utils:**
- `validation.js` - Course code validation and normalization

### Backend (FastAPI)

**API Routes:**
- `/api/majors` - List all majors
- `/api/majors/{major_name}/courses` - Get major courses
- `/api/recommend` - Get recommendations (POST)
- `/api/courses/{course_code}` - Get course details
- `/api/courses/{course_code}/prerequisites` - Get prerequisites

**Services:**
- `data_loader.py` - Loads and caches course/major data
- `prereq_checker.py` - Validates prerequisites (OR logic)
- `recommender.py` - Rule-based recommendation engine

**Models:**
- `course.py` - Pydantic models for requests/responses

**Utils:**
- `validation.py` - Course code validation

## Data Flow

1. **User selects completed courses** → Frontend validates
2. **Frontend sends POST /api/recommend** → Backend validates
3. **Backend loads major requirements** → Data loader
4. **Backend checks prerequisites** → Prereq checker
5. **Backend generates recommendations** → Recommender service
6. **Backend returns recommendations** → Frontend displays

## Recommendation Algorithm

1. **Collect all courses** from major requirements
2. **Filter by prerequisites** - Only courses that can be taken
3. **Rank by priority:**
   - Required courses first
   - Lower course level (100/200) before higher (300/400)
   - Higher postrequisite count (unlocks more courses)
4. **Filter inappropriate courses** - Remove 400-level capstones for freshmen
5. **Return top N recommendations**

## Prerequisite Logic

Prerequisites use **OR logic**:
- If prerequisites are `['CS 124', 'CS 125']`, student needs **either** CS 124 **or** CS 125
- This handles alternative prerequisite paths

## Validation

**Backend:**
- Pydantic validators on request models
- Course code format validation
- Automatic normalization

**Frontend:**
- Client-side validation before API calls
- Error handling with user-friendly messages

## Error Handling

- **400 Bad Request**: Invalid input (validated by Pydantic)
- **404 Not Found**: Major/course not found
- **500 Server Error**: Internal errors with details
- **Timeout**: 30-second request timeout
- **Connection Error**: Clear message when backend is down

## Security Considerations

- CORS configured for development
- Input validation on all endpoints
- No user authentication (MVP)
- No sensitive data stored

## Performance

- Data loaded once and cached in memory
- Fast prerequisite checking with set operations
- Efficient recommendation ranking
- Frontend optimizations (React hooks, memoization)

## Future Enhancements

- Database instead of JSON files
- User accounts and saved progress
- ML-based recommendations
- Semester planning
- Course conflict detection
- Gen Ed requirement tracking

