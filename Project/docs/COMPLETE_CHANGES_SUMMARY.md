# Complete Changes Summary: Frontend & Backend Implementation

This document explains every single change made to transform the project into a full-stack course recommendation system.

## Overview

The system was transformed from a data scraping project into a complete full-stack application with:
- **Backend**: FastAPI REST API with rule-based recommendation engine
- **Frontend**: React application with course selection and recommendation display
- **Integration**: Sample sequence data for semester-by-semester planning

---

## Backend Implementation (FastAPI)

### 1. Project Structure Created

**New Directory Structure:**
```
Project/backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py        # API endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   └── course.py        # Pydantic data models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── data_loader.py   # Loads course/major data
│   │   ├── prereq_checker.py # Validates prerequisites
│   │   ├── recommender.py    # Recommendation engine
│   │   └── year_detector.py # Detects student year
│   └── utils/
│       ├── __init__.py
│       └── validation.py    # Input validation
├── requirements.txt
└── README.md
```

### 2. Main Application (`app/main.py`)

**Purpose**: FastAPI application entry point

**Key Features:**
- Creates FastAPI app instance
- Configures CORS for frontend communication
- Includes API routes
- Sets up logging
- Runs on `http://localhost:8000`

**Code Structure:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(title="Course Recommendation API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)
app.include_router(router, prefix="/api")
```

### 3. Data Models (`app/models/course.py`)

**Purpose**: Define request/response structures using Pydantic

**Models Created:**
1. **`Course`**: Represents a course with code, name, credits, prerequisites, postrequisites
2. **`Recommendation`**: Represents a course recommendation with:
   - `course_code`, `name`, `credits`
   - `reason`: Why it's recommended
   - `prerequisites_met`: Boolean
   - `missing_prerequisites`: List of missing prereqs
   - `sequence_aligned`: Whether it's in sample sequence
   - `semester`: "fall" or "spring" if in sequence
3. **`Progress`**: Degree progress with `completed`, `total`, `percentage`
4. **`RecommendationResponse`**: Full API response with:
   - `recommendations`: List of recommendations
   - `progress`: Progress object
   - `semester_plan`: Optional semester grouping
   - `student_year`: Detected year (first_year, second_year, etc.)

**Why Pydantic?**
- Automatic validation
- Type checking
- JSON schema generation
- Clear error messages

### 4. Data Loader Service (`app/services/data_loader.py`)

**Purpose**: Load and cache course graph and major requirements

**Key Features:**
- **Lazy Loading**: Only loads data when first accessed
- **Caching**: Stores loaded data in memory for performance
- **Path Resolution**: Automatically finds data files relative to script location
- **Sample Sequence Loading**: Loads sample sequences from `sample_sequences.json`

**Methods:**
- `load_course_graph()`: Loads `course_graph.json` and builds lookup dictionary
- `load_major_requirements()`: Loads `major_requirements.json`
- `load_sample_sequences()`: Loads `sample_sequences.json` (299 majors)
- `get_course(course_code)`: Get course by code
- `get_major(major_name)`: Get major requirements
- `get_sample_sequence(major_name)`: Get sample sequence with fuzzy matching
- `get_all_majors()`: List all available majors

**Singleton Pattern**: Uses global `_data_loader` instance for efficiency

### 5. Prerequisite Checker (`app/services/prereq_checker.py`)

**Purpose**: Validate if prerequisites are satisfied

**Key Functions:**
- `normalize_course_code(code)`: Standardizes format (e.g., "cs 124" → "CS 124")
- `parse_prerequisite_string(prereq_str)`: Parses strings like "CS 124 or CS 125"
- `check_prerequisites_met(prerequisites, completed_courses)`: 
  - **OR Logic**: If prerequisites are ["CS 124", "CS 125"], student needs ONE of them
  - Returns `(all_met: bool, missing: List[str])`
- `can_take_course(course_code, completed_courses, course_data)`: Main check function

**Important**: Handles OR logic correctly (e.g., "CS 124 or CS 125" means either is sufficient)

### 6. Year Detector (`app/services/year_detector.py`)

**Purpose**: Detect student's academic year from completed courses

**Logic:**
- **Fourth Year**: CS 421 completed, or 2+ third-year milestones (CS 341, CS 357, CS 374)
- **Third Year**: 1+ third-year milestones, or 2+ second-year milestones
- **Second Year**: 1+ second-year milestones (CS 225, CS 233, CS 361), or MATH/PHYS second-year courses
- **First Year**: 1+ first-year courses (CS 124, CS 128, CS 173, MATH 221, MATH 231)

**Functions:**
- `detect_student_year(completed_courses)`: Main detection function
- `get_semester_from_course(course_code, student_year, sample_sequence)`: Gets semester for a course
- `is_in_sample_sequence(course_code, student_year, sample_sequence)`: Checks if course is in sequence

**Milestone Courses:**
- First: CS 124, CS 128, CS 173, MATH 221, MATH 231
- Second: CS 225, CS 233, CS 361, MATH 241, MATH 257, PHYS 211, PHYS 212
- Third: CS 341, CS 357, CS 374
- Fourth: CS 421

### 7. Recommender Service (`app/services/recommender.py`)

**Purpose**: Core recommendation engine using rule-based logic

**Key Methods:**

#### `get_major_courses(major_name)`
- Extracts all courses from major requirements
- Separates required vs. elective courses
- Identifies focus areas/concentrations
- Returns: `{required: [], electives: [], focus_areas: []}`

#### `recommend_courses(major_name, completed_courses, num_recommendations, include_semester_planning)`
**Main recommendation algorithm:**

1. **Normalize Input**: Convert all course codes to standard format
2. **Load Data**: Get major requirements and sample sequence
3. **Detect Year**: Determine student's academic year
4. **Collect Courses**: Gather all courses from major requirements
5. **Filter Eligible**: Only courses where prerequisites are met
6. **Check Sequence Alignment**: Mark courses in sample sequence
7. **Rank Courses** by priority:
   - Sequence-aligned courses first
   - Required courses before electives
   - Lower course level (100/200) before higher (300/400)
   - Higher postrequisite count (unlocks more courses)
8. **Filter Advanced**: Remove 400-level courses unless clearly appropriate
9. **Group by Semester**: Organize into fall/spring if sequence available
10. **Calculate Progress**: Count completed vs. total required courses

**Returns:**
```python
{
    'recommendations': [...],
    'progress': {'completed': 5, 'total': 50, 'percentage': 10.0},
    'semester_plan': {
        'fall': {'courses': [...], 'total_credits': 12.0},
        'spring': {'courses': [...], 'total_credits': 15.0},
        'other': {'courses': [...]},
        'student_year': 'first_year'
    },
    'student_year': 'first_year'
}
```

**Helper Functions:**
- `get_course_level(course_code)`: Extracts level (1, 2, 3, 4) from course code
- `is_appropriate_level(course_item)`: Filters out too-advanced courses

### 8. API Routes (`app/api/routes.py`)

**Purpose**: Define REST API endpoints

**Endpoints:**

#### `GET /api/majors`
- Returns list of all available majors
- Response: `{"majors": [{"name": "...", "url": "..."}]}`

#### `GET /api/majors/{major_name}/courses`
- Gets all courses for a major
- Returns: `{required: [], electives: [], focus_areas: []}`
- 404 if major not found

#### `POST /api/recommend`
- Main recommendation endpoint
- **Request Body:**
  ```json
  {
    "major_name": "Computer Science, BS",
    "completed_courses": ["CS 124", "MATH 221"],
    "num_recommendations": 10
  }
  ```
- **Validation**:
  - `completed_courses`: Must have at least 1, validated format
  - `num_recommendations`: Between 1 and 20
- **Response**: `RecommendationResponse` with recommendations, progress, semester plan

#### `GET /api/courses/{course_code}`
- Get detailed course information
- Returns full course object with prerequisites, description, etc.

#### `GET /api/courses/{course_code}/prerequisites`
- Get prerequisite chain for a course
- Returns: `{course_code, prerequisites, can_take, missing}`

**Error Handling:**
- 400: Bad request (validation errors)
- 404: Resource not found
- 500: Server errors with detailed messages

### 9. Validation Utilities (`app/utils/validation.py`)

**Purpose**: Validate and normalize course codes

**Functions:**
- `validate_course_code(code)`: Checks format (e.g., "CS 124", "MATH 221")
- `normalize_course_code(code)`: Standardizes format
- `validate_course_codes(codes)`: Batch validation and normalization

**Regex Pattern**: `^[A-Z]{2,4}\s+\d{3}[A-Z]?$`

---

## Frontend Implementation (React)

### 1. Project Structure

**Directory Structure:**
```
Project/Frontend/
├── src/
│   ├── App.jsx              # Main app component
│   ├── App.css              # Main styles
│   ├── index.css            # Global styles
│   ├── main.jsx             # React entry point
│   ├── components/
│   │   ├── CourseSelector.jsx
│   │   ├── CourseSelector.css
│   │   ├── Recommendations.jsx
│   │   ├── Recommendations.css
│   │   ├── ProgressBar.jsx
│   │   ├── ProgressBar.css
│   │   ├── CourseDetails.jsx
│   │   ├── CourseDetails.css
│   │   ├── SemesterPlan.jsx
│   │   └── SemesterPlan.css
│   ├── services/
│   │   └── api.js           # API service layer
│   └── utils/
│       └── validation.js    # Frontend validation
├── package.json
└── vite.config.js
```

### 2. Main App Component (`src/App.jsx`)

**Purpose**: Orchestrates the entire application flow

**State Management:**
- `screen`: Current screen ('welcome', 'select-courses', 'recommendations')
- `courses`: All courses for the major
- `selectedCourses`: User's selected completed courses
- `recommendations`: Generated recommendations
- `progress`: Degree progress object
- `semesterPlan`: Semester-by-semester plan
- `studentYear`: Detected academic year
- `loading`: Loading state
- `error`: Error messages
- `selectedCourseDetails`: Course code for details modal

**Screen Flow:**

#### Welcome Screen
- Displays welcome message
- "Start Planning" button → navigates to course selection
- Shows loading/error states

#### Course Selection Screen
- Loads courses on mount via `getMajorCourses()`
- Displays `CourseSelector` component
- "Back" button → returns to welcome
- "Get Recommendations" button → calls API and navigates to recommendations
- Validates courses before sending

#### Recommendations Screen
- Displays `ProgressBar` component
- Shows `SemesterPlan` component (if available)
- Displays `Recommendations` component
- Shows student year indicator
- "Back to Selection" button → returns to course selection
- "Start Over" button → resets everything

**Key Functions:**
- `loadMajorCourses()`: Fetches courses for major on mount
- `handleGetRecommendations()`: 
  - Validates selected courses
  - Calls `getRecommendations()` API
  - Updates state with results
  - Navigates to recommendations screen
- `handleCourseClick(courseCode)`: Opens course details modal

### 3. API Service Layer (`src/services/api.js`)

**Purpose**: Centralized API communication using Axios

**Configuration:**
- Base URL: `http://localhost:8000` (or from env variable)
- Timeout: 30 seconds
- Content-Type: application/json

**Error Handling:**
- **Response Interceptor**: Centralized error handling
  - Timeout errors → "Request timeout. Please try again."
  - Server errors → Uses error message from response
  - Connection errors → "Unable to connect to server..."
- All errors are caught and re-thrown with user-friendly messages

**API Functions:**

#### `getMajors()`
- GET `/api/majors`
- Returns: Array of major objects

#### `getMajorCourses(majorName)`
- GET `/api/majors/{majorName}/courses`
- Returns: `{required: [], electives: [], focus_areas: []}`

#### `getRecommendations(majorName, completedCourses, numRecommendations)`
- POST `/api/recommend`
- Request body: `{major_name, completed_courses, num_recommendations}`
- Returns: Full recommendation response with semester plan

#### `getCourseDetails(courseCode)`
- GET `/api/courses/{courseCode}`
- Returns: Full course object

#### `getCoursePrerequisites(courseCode)`
- GET `/api/courses/{courseCode}/prerequisites`
- Returns: Prerequisite information

### 4. Validation Utilities (`src/utils/validation.js`)

**Purpose**: Client-side validation before API calls

**Functions:**
- `validateCourseCode(code)`: Validates format using regex
- `normalizeCourseCode(code)`: 
  - Normalizes valid codes
  - Uses JavaScript array access `match[1]` for regex groups
- `validateAndNormalizeCourses(codes)`: 
  - Filters out invalid codes
  - Normalizes valid codes
  - Returns array of valid normalized codes

**Why?**: Prevents unnecessary API calls and provides immediate feedback

### 5. Course Selector Component (`src/components/CourseSelector.jsx`)

**Purpose**: Allow users to search, filter, and select completed courses

**Features:**
- **Search Bar**: Real-time filtering by course code/name
- **Department Filter**: Dropdown to filter by department (CS, MATH, ENG, PHYS, All)
- **Multi-Select**: Checkboxes for each course
- **Selected Count**: Shows "X selected" and "Clear All" button
- **Responsive**: Works on mobile and desktop

**Props:**
- `courses`: Array of course objects
- `selectedCourses`: Array of selected course codes
- `onSelectionChange`: Callback when selection changes

**State:**
- `searchQuery`: Search input value
- `selectedDepartment`: Current department filter

**Filtering Logic:**
- Filters by search query (course code or name)
- Filters by department
- Updates in real-time as user types

### 6. Recommendations Component (`src/components/Recommendations.jsx`)

**Purpose**: Display recommended courses in card format

**Features:**
- **Course Cards**: Each recommendation shown as a card with:
  - Course code and name
  - Credits
  - Reason for recommendation
  - Clickable to view details
- **Empty State**: Message when no recommendations
- **Sequence Badge**: Visual indicator for sequence-aligned courses
- **Semester Badge**: Shows "Fall" or "Spring" if applicable

**Props:**
- `recommendations`: Array of recommendation objects
- `onCourseClick`: Callback when course is clicked

**Styling:**
- Card-based layout
- Hover effects
- Color-coded by recommendation type

### 7. Progress Bar Component (`src/components/ProgressBar.jsx`)

**Purpose**: Visualize degree progress

**Features:**
- **Progress Bar**: Visual bar showing percentage
- **Text Display**: "X of Y courses completed (Z%)"
- **Color Coding**: Changes color based on progress

**Props:**
- `progress`: `{completed, total, percentage}`

### 8. Semester Plan Component (`src/components/SemesterPlan.jsx`)

**Purpose**: Display semester-by-semester course plan

**Features:**
- **Semester Cards**: Separate cards for Fall and Spring
- **Credit Totals**: Shows total credits per semester
- **Course List**: Lists courses with codes, names, and credits
- **Year Indicator**: Shows detected student year
- **Other Courses**: Shows courses not in specific semester

**Props:**
- `semesterPlan`: Semester plan object from API
- `studentYear`: Detected academic year

**Layout:**
- Grid layout (responsive)
- Fall semester: Orange accent
- Spring semester: Green accent
- Credit badges for each semester

### 9. Course Details Component (`src/components/CourseDetails.jsx`)

**Purpose**: Modal to show detailed course information

**Features:**
- **Modal Overlay**: Click outside to close
- **Course Information**: 
  - Code, name, credits
  - Description
  - Prerequisites
  - Postrequisites
- **Loading State**: Shows while fetching
- **Error Handling**: Displays errors if fetch fails
- **Close Button**: X button to close modal

**Props:**
- `courseCode`: Course code to display
- `onClose`: Callback to close modal

**API Call**: Uses `getCourseDetails()` to fetch full course data

### 10. Styling (`App.css`, component CSS files)

**Key Styles:**
- **Welcome Screen**: Centered layout with background image
- **Course Selection**: Search bar, filter dropdown, course grid
- **Recommendations**: Card layout, hover effects
- **Semester Plan**: Grid layout with semester cards
- **Responsive**: Media queries for mobile devices
- **Error Messages**: Red styling for errors
- **Loading States**: Spinner/loading indicators

---

## Data Integration

### Sample Sequence Data

**File**: `data_scraping/output/ml_ready/sample_sequences.json`

**Structure:**
```json
{
  "Major Name, Degree": {
    "first_year": {
      "fall": {
        "courses": [{"code": "CS 124", "credits": "3", "required": true}],
        "total_credits": 16.0
      },
      "spring": {...}
    },
    "second_year": {...},
    "third_year": {...},
    "fourth_year": {...}
  }
}
```

**Coverage**: 299 majors (94.6% of 316 total majors)

---

## Key Features Implemented

### 1. Prerequisite Validation
- ✅ OR logic (e.g., "CS 124 or CS 125")
- ✅ Normalized course code matching
- ✅ Missing prerequisites tracking

### 2. Year Detection
- ✅ Automatic detection from completed courses
- ✅ Milestone-based progression
- ✅ Handles edge cases

### 3. Sample Sequence Integration
- ✅ 299 majors with official 4-year plans
- ✅ Semester alignment (fall/spring)
- ✅ Priority ranking based on sequence

### 4. Semester Planning
- ✅ Groups recommendations by semester
- ✅ Calculates credit hours per semester
- ✅ Visual semester cards

### 5. Input Validation
- ✅ Frontend validation before API calls
- ✅ Backend validation with Pydantic
- ✅ Normalized course codes

### 6. Error Handling
- ✅ Centralized API error handling
- ✅ User-friendly error messages
- ✅ Loading states

### 7. User Experience
- ✅ Search and filter courses
- ✅ Multi-select interface
- ✅ Progress visualization
- ✅ Course details modal
- ✅ Responsive design

---

## API Request/Response Examples

### Get Recommendations Request
```http
POST /api/recommend
Content-Type: application/json

{
  "major_name": "Computer Science, BS",
  "completed_courses": ["CS 124", "MATH 221"],
  "num_recommendations": 10
}
```

### Get Recommendations Response
```json
{
  "recommendations": [
    {
      "course_code": "CS 128",
      "name": "Introduction to Computer Science II",
      "credits": "3",
      "reason": "Recommended for Spring semester (sample sequence)",
      "prerequisites_met": true,
      "missing_prerequisites": [],
      "sequence_aligned": true,
      "semester": "spring"
    },
    ...
  ],
  "progress": {
    "completed": 2,
    "total": 74,
    "percentage": 2.7
  },
  "semester_plan": {
    "fall": {
      "courses": [...],
      "total_credits": 1.0
    },
    "spring": {
      "courses": [...],
      "total_credits": 9.0
    },
    "student_year": "first_year"
  },
  "student_year": "first_year"
}
```

---

## Bug Fixes Applied

### 1. Regex Match Error
**Problem**: `match.group is not a function` when `course_code` wasn't a string
**Fix**: Added type checking in `get_course_level()` and `is_appropriate_level()`

### 2. Prerequisite OR Logic
**Problem**: Prerequisites treated as AND instead of OR
**Fix**: Updated `check_prerequisites_met()` to use OR logic

### 3. Progress Calculation
**Problem**: Progress always showed 0%
**Fix**: Tracked all major courses (including completed) and calculated intersection

### 4. Inappropriate Recommendations
**Problem**: Recommending 400-level courses to freshmen
**Fix**: Added level filtering and course level prioritization

---

## Testing

### Backend Testing
```bash
cd Project/backend
python3 -c "from app.services.recommender import get_recommender; r = get_recommender(); result = r.recommend_courses('Computer Science, BS', ['CS 124', 'MATH 221'], 5, True); print(result)"
```

### Frontend Testing
1. Start backend: `cd Project/backend && uvicorn app.main:app --reload`
2. Start frontend: `cd Project/Frontend && npm run dev`
3. Open http://localhost:5173
4. Select courses and get recommendations

### API Testing
```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"major_name": "Computer Science, BS", "completed_courses": ["CS 124", "MATH 221"], "num_recommendations": 5}'
```

---

## File Summary

### Backend Files Created/Modified
- `backend/app/main.py` - FastAPI app
- `backend/app/api/routes.py` - API endpoints
- `backend/app/models/course.py` - Data models
- `backend/app/services/data_loader.py` - Data loading
- `backend/app/services/prereq_checker.py` - Prerequisite validation
- `backend/app/services/recommender.py` - Recommendation engine
- `backend/app/services/year_detector.py` - Year detection
- `backend/app/utils/validation.py` - Input validation
- `backend/requirements.txt` - Dependencies
- `backend/README.md` - Setup instructions

### Frontend Files Created/Modified
- `Frontend/src/App.jsx` - Main app component
- `Frontend/src/App.css` - Main styles
- `Frontend/src/services/api.js` - API service
- `Frontend/src/utils/validation.js` - Validation
- `Frontend/src/components/CourseSelector.jsx` - Course selection
- `Frontend/src/components/Recommendations.jsx` - Recommendations display
- `Frontend/src/components/ProgressBar.jsx` - Progress visualization
- `Frontend/src/components/CourseDetails.jsx` - Course details modal
- `Frontend/src/components/SemesterPlan.jsx` - Semester planning
- Component CSS files for each component

### Data Files
- `data_scraping/output/ml_ready/sample_sequences.json` - 299 sample sequences

---

## Dependencies

### Backend (`requirements.txt`)
- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `pydantic` - Data validation
- `python-multipart` - Form data
- `networkx` - Graph operations (for future use)

### Frontend (`package.json`)
- `react` - UI library
- `react-dom` - React DOM
- `axios` - HTTP client
- `vite` - Build tool

---

## How It All Works Together

1. **User opens frontend** → React app loads
2. **User clicks "Start Planning"** → Frontend calls `GET /api/majors/{major}/courses`
3. **Backend loads data** → DataLoader loads course graph and major requirements
4. **Frontend displays courses** → CourseSelector shows all courses for major
5. **User selects courses** → State updates in App.jsx
6. **User clicks "Get Recommendations"** → Frontend validates and calls `POST /api/recommend`
7. **Backend processes**:
   - Normalizes course codes
   - Detects student year
   - Loads sample sequence
   - Filters eligible courses
   - Ranks by priority
   - Groups by semester
8. **Backend returns** → Recommendations, progress, semester plan
9. **Frontend displays** → Shows progress bar, semester plan, and recommendations
10. **User clicks course** → Opens CourseDetails modal with full information

---

## Next Steps for Team Members

1. **Review the code** in `Project/backend/` and `Project/Frontend/src/`
2. **Test the system** by running both servers
3. **Understand the data flow** from frontend → API → services → data files
4. **Extend features**:
   - Add more majors (currently hardcoded to CS)
   - Improve year detection for non-CS majors
   - Add Gen Ed requirement tracking
   - Enhance semester planning

---

## Important Notes

- **Hardcoded Major**: Currently set to "Computer Science, BS" in `App.jsx`
- **Sample Sequences**: 299 majors have sequences, 17 don't (handled gracefully)
- **Year Detection**: Optimized for CS major, may need tuning for others
- **No Authentication**: System works without user accounts (as requested)
- **Data Location**: All data files in `data_scraping/output/ml_ready/`

---

This completes the full-stack implementation. The system is fully functional and ready for use!

