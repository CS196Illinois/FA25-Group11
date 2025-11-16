# Frontend Complete Guide

This document provides a comprehensive explanation of every aspect of the frontend application.

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [User Flows](#user-flows)
8. [Styling System](#styling-system)
9. [Utilities](#utilities)
10. [Build & Deployment](#build--deployment)

---

## Overview

The frontend is a **React single-page application (SPA)** built with **Vite** that provides a user interface for the UIUC Course Recommendation System. It allows students to:

1. Select completed courses
2. Receive personalized course recommendations
3. View semester-by-semester planning
4. Track degree progress
5. Explore detailed course information

**Key Characteristics:**
- **No routing library**: Uses simple state-based screen management
- **No state management library**: Uses React's built-in `useState` and `useEffect`
- **Component-based architecture**: Modular, reusable components
- **Responsive design**: Works on desktop and mobile devices
- **Real-time validation**: Client-side validation before API calls

---

## Technology Stack

### Core Technologies

- **React 19.1.1**: UI library for building components
- **React DOM 19.1.1**: React rendering for web browsers
- **Vite 7.1.7**: Build tool and development server
- **Axios 1.13.2**: HTTP client for API requests

### Development Tools

- **ESLint**: Code linting and quality checks
- **@vitejs/plugin-react**: Vite plugin for React support
- **TypeScript types**: Type definitions for React (dev dependency)

### Build Configuration

- **Module System**: ES6 modules (`"type": "module"`)
- **Development Server**: Vite dev server (typically `http://localhost:5173`)
- **Build Output**: Static files in `dist/` directory

---

## Project Structure

```
Frontend/
├── public/                 # Static assets
│   └── vite.svg
├── src/
│   ├── assets/            # Images and media files
│   │   ├── background.jpg
│   │   └── ...
│   ├── components/        # React components
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
│   ├── services/          # API service layer
│   │   └── api.js
│   ├── utils/             # Utility functions
│   │   └── validation.js
│   ├── App.jsx            # Main app component
│   ├── App.css            # Main app styles
│   ├── index.css          # Global styles
│   └── main.jsx           # React entry point
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── eslint.config.js       # ESLint configuration
```

### File Organization Principles

1. **Components**: Each component has its own `.jsx` and `.css` file
2. **Services**: API-related code in `services/` directory
3. **Utils**: Reusable utility functions in `utils/` directory
4. **Assets**: Static files in `assets/` or `public/` directories
5. **Styles**: Component-specific styles co-located with components

---

## Component Architecture

### Component Hierarchy

```
App (Main Container)
├── Welcome Screen
├── Course Selection Screen
│   └── CourseSelector
├── Recommendations Screen
│   ├── Year Indicator
│   ├── ProgressBar
│   ├── SemesterPlan
│   └── Recommendations
└── CourseDetails (Modal - conditionally rendered)
```

### 1. App Component (`src/App.jsx`)

**Purpose**: Main orchestrator component that manages the entire application flow.

**Responsibilities:**
- Screen navigation (welcome → selection → recommendations)
- State management for all application data
- API calls coordination
- Error handling
- Loading states

**State Variables:**
```javascript
const [screen, setScreen] = useState('welcome');              // Current screen
const [courses, setCourses] = useState([]);                  // All courses for major
const [selectedCourses, setSelectedCourses] = useState([]);   // User selections
const [recommendations, setRecommendations] = useState([]);   // API recommendations
const [progress, setProgress] = useState({...});             // Degree progress
const [semesterPlan, setSemesterPlan] = useState(null);      // Semester grouping
const [studentYear, setStudentYear] = useState(null);        // Detected year
const [loading, setLoading] = useState(false);               // Loading state
const [error, setError] = useState(null);                    // Error messages
const [selectedCourseDetails, setSelectedCourseDetails] = useState(null); // Modal state
```

**Key Functions:**

#### `loadMajorCourses()`
- **Called**: On component mount (`useEffect`)
- **Purpose**: Fetches all courses for the hardcoded major
- **API**: `getMajorCourses('Computer Science, BS')`
- **Updates**: `courses`, `loading`, `error` states
- **Error Handling**: Sets user-friendly error message

#### `handleGetRecommendations()`
- **Called**: When user clicks "Get Recommendations" button
- **Purpose**: Validates selections and fetches recommendations
- **Validation**: Uses `validateAndNormalizeCourses()` before API call
- **API**: `getRecommendations(majorName, courses, 10)`
- **Updates**: All recommendation-related states
- **Navigation**: Changes screen to 'recommendations'

#### `handleCourseClick(courseCode)`
- **Called**: When user clicks a course card
- **Purpose**: Opens course details modal
- **Updates**: `selectedCourseDetails` state

#### `handleCloseDetails()`
- **Called**: When user closes course details modal
- **Purpose**: Closes modal
- **Updates**: Sets `selectedCourseDetails` to `null`

**Screen Rendering Logic:**
- **Conditional Rendering**: Uses `screen` state to show different views
- **Three Screens**: `'welcome'`, `'course-selection'`, `'recommendations'`
- **Modal Overlay**: `CourseDetails` rendered conditionally based on `selectedCourseDetails`

**Hardcoded Values:**
- `MAJOR_NAME = 'Computer Science, BS'`: Currently hardcoded (future: make dynamic)

---

### 2. CourseSelector Component (`src/components/CourseSelector.jsx`)

**Purpose**: Allows users to search, filter, and select completed courses.

**Props:**
- `courses`: Array of course objects `[{course_code, name, credits}, ...]`
- `selectedCourses`: Array of selected course codes `['CS 124', 'MATH 221', ...]`
- `onSelectionChange`: Callback function `(newSelection) => void`

**Internal State:**
```javascript
const [searchTerm, setSearchTerm] = useState('');      // Search input
const [filterDept, setFilterDept] = useState('');    // Department filter
```

**Key Features:**

#### Search Functionality
- **Real-time filtering**: Updates as user types
- **Search fields**: Course code AND course name
- **Case-insensitive**: Uses `.toLowerCase()` for comparison
- **Implementation**: `useMemo` hook for performance

#### Department Filtering
- **Dynamic departments**: Extracted from course codes using regex
- **Dropdown menu**: Select department or "All Departments"
- **Extraction logic**: `course_code.match(/^([A-Z]{2,4})/)[1]`
- **Sorted alphabetically**: Departments displayed in order

#### Multi-Select Interface
- **Checkboxes**: Each course has a checkbox
- **Click anywhere**: Entire row is clickable
- **Toggle behavior**: Click to select/deselect
- **Visual feedback**: Selected courses have `.selected` class

#### Selected Count Display
- **Dynamic count**: Shows "X course(s) selected"
- **Clear All button**: Appears when selections exist
- **One-click clear**: Resets all selections

**Filtering Logic:**
```javascript
const filteredCourses = useMemo(() => {
  return courses.filter(course => {
    const code = course.course_code || '';
    const name = course.name || '';
    const matchesSearch = 
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filterDept || code.startsWith(filterDept);
    return matchesSearch && matchesDept;
  });
}, [courses, searchTerm, filterDept]);
```

**Performance Optimizations:**
- **useMemo**: Prevents unnecessary re-filtering on every render
- **Dependencies**: Only re-computes when `courses`, `searchTerm`, or `filterDept` change

**Empty State:**
- Shows "No courses found" when filters return no results

---

### 3. Recommendations Component (`src/components/Recommendations.jsx`)

**Purpose**: Displays recommended courses in a card-based layout.

**Props:**
- `recommendations`: Array of recommendation objects
- `onCourseClick`: Callback function `(courseCode) => void`

**Recommendation Object Structure:**
```javascript
{
  course_code: "CS 128",
  name: "Introduction to Computer Science II",
  credits: "3",
  reason: "Recommended for Spring semester (sample sequence)",
  prerequisites_met: true,
  missing_prerequisites: [],
  sequence_aligned: true,
  semester: "spring"
}
```

**Features:**

#### Card Layout
- **Grid display**: Responsive grid of recommendation cards
- **Numbered**: Each card shows its rank (#1, #2, etc.)
- **Clickable**: Entire card is clickable to view details
- **Hover effects**: Visual feedback on hover

#### Information Display
- **Course code**: Prominent display at top
- **Course name**: Full course title
- **Credits**: Credit hours
- **Reason**: Why this course is recommended
- **Prerequisite status**: Shows if prerequisites are met

#### Empty State
- **Message**: "No recommendations available..."
- **Hint**: Explains why (completed all courses or need prerequisites)

**Styling:**
- Cards use CSS Grid for responsive layout
- Color-coded by recommendation type
- Visual indicators for sequence-aligned courses

---

### 4. ProgressBar Component (`src/components/ProgressBar.jsx`)

**Purpose**: Visualizes degree completion progress.

**Props:**
- `progress`: Object with `{completed, total, percentage}`

**Features:**

#### Visual Progress Bar
- **Animated fill**: Width based on percentage
- **Color coding**: Changes color based on progress level
- **Percentage display**: Shows percentage inside bar

#### Text Display
- **Format**: "X / Y courses (Z%)"
- **Header**: "Degree Progress" title
- **Dynamic values**: Updates based on props

**Implementation:**
```javascript
<div 
  className="progress-bar-fill"
  style={{ width: `${Math.min(percentage, 100)}%` }}
>
  <span className="progress-percentage">{percentage.toFixed(1)}%</span>
</div>
```

**Edge Cases:**
- Handles `null` or `undefined` progress object
- Defaults to 0 if values are missing
- Caps percentage at 100%

---

### 5. SemesterPlan Component (`src/components/SemesterPlan.jsx`)

**Purpose**: Displays semester-by-semester course recommendations.

**Props:**
- `semesterPlan`: Object with fall/spring/other course groups
- `studentYear`: Detected academic year string

**Semester Plan Structure:**
```javascript
{
  fall: {
    courses: [...],
    total_credits: 12.0
  },
  spring: {
    courses: [...],
    total_credits: 15.0
  },
  other: {
    courses: [...],
    total_credits: 3.0
  },
  student_year: "first_year"
}
```

**Features:**

#### Semester Cards
- **Fall Semester**: Orange-themed card
- **Spring Semester**: Green-themed card
- **Credit totals**: Shows total credits per semester
- **Course lists**: Lists all courses with codes, names, credits

#### Year Formatting
- **Mapping**: Converts `'first_year'` → `'First Year'`
- **Display**: Shows "Semester Plan - First Year"

#### Other Courses Section
- **Tag display**: Shows courses not in specific semester
- **Compact format**: Just course codes as tags

**Conditional Rendering:**
- Only renders if `semesterPlan` exists and has data
- Each semester card only shows if it has courses
- "Other courses" only shows if there are other courses

**Layout:**
- Grid layout for side-by-side semester cards
- Responsive: Stacks on mobile devices

---

### 6. CourseDetails Component (`src/components/CourseDetails.jsx`)

**Purpose**: Modal overlay showing detailed course information.

**Props:**
- `courseCode`: Course code to display (e.g., "CS 124")
- `onClose`: Callback function to close modal

**Internal State:**
```javascript
const [course, setCourse] = useState(null);      // Course data
const [loading, setLoading] = useState(true);     // Loading state
const [error, setError] = useState(null);        // Error state
```

**Features:**

#### Modal Overlay
- **Backdrop**: Dark overlay covering entire screen
- **Click outside**: Closes modal when clicking backdrop
- **Close button**: X button in top-right corner
- **Centered**: Modal centered on screen

#### Course Information Display
- **Course code**: Large, prominent
- **Course name**: Full title
- **Credits**: Credit hours
- **Description**: Full course description (if available)
- **Prerequisites**: List of prerequisite courses as tags
- **Postrequisites**: Courses that this course unlocks (limited to 10, shows "+X more")
- **External link**: Link to UIUC course catalog (if available)

#### Loading & Error States
- **Loading**: Shows "Loading..." while fetching
- **Error**: Displays error message if fetch fails
- **Empty state**: Returns `null` if no `courseCode` provided

**API Integration:**
- **Fetches on mount**: `useEffect` triggers when `courseCode` changes
- **API call**: `getCourseDetails(courseCode)`
- **Error handling**: Catches and displays errors

**Data Structure:**
```javascript
{
  course_code: "CS 124",
  name: "Introduction to Computer Science I",
  credits: "3",
  description: "Course description...",
  prerequisites: ["MATH 220", "MATH 221"],
  postrequisites: ["CS 128", "CS 173", ...],
  link: "https://catalog.illinois.edu/..."
}
```

---

## State Management

### State Architecture

The application uses **React's built-in state management** (no Redux, Context API, or other libraries).

### State Flow

```
App Component (Central State)
    ↓
Props passed to child components
    ↓
Callbacks update parent state
    ↓
Re-render with new state
```

### State Categories

#### 1. Navigation State
- **`screen`**: Controls which screen is displayed
- **Values**: `'welcome'`, `'course-selection'`, `'recommendations'`
- **Updates**: Via `setScreen()` calls

#### 2. Data State
- **`courses`**: All courses for the major (loaded once)
- **`selectedCourses`**: User's selected courses
- **`recommendations`**: API response recommendations
- **`semesterPlan`**: Semester grouping data
- **`studentYear`**: Detected academic year

#### 3. UI State
- **`loading`**: Loading indicator state
- **`error`**: Error message state
- **`selectedCourseDetails`**: Modal open/close state

#### 4. Derived State
- **`progress`**: Calculated from completed courses
- **Filtered courses**: Computed in `CourseSelector` via `useMemo`

### State Updates

**Pattern:**
```javascript
// 1. User action triggers callback
onClick={() => handleAction()}

// 2. Handler updates state
const handleAction = () => {
  setState(newValue);
};

// 3. Component re-renders with new state
// 4. Child components receive updated props
```

**Example Flow:**
1. User selects course → `CourseSelector` calls `onSelectionChange(['CS 124'])`
2. `App` updates `selectedCourses` state
3. `CourseSelector` re-renders with new `selectedCourses` prop
4. Checkbox reflects new selection

### State Persistence

- **No persistence**: State is lost on page refresh
- **Session-based**: All data exists only in memory
- **Future enhancement**: Could add localStorage or sessionStorage

---

## API Integration

### API Service Layer (`src/services/api.js`)

**Purpose**: Centralized HTTP client for all backend communication.

#### Configuration

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});
```

**Environment Variables:**
- Uses `VITE_API_URL` if set (for production)
- Defaults to `http://localhost:8000` (development)

#### Error Handling

**Response Interceptor:**
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.';
    } else if (error.response) {
      // Server responded with error
      const message = error.response.data?.detail || 
                     error.response.data?.message || 
                     error.message;
      error.message = message;
    } else if (error.request) {
      // Request made but no response
      error.message = 'Unable to connect to server. Please check if the backend is running.';
    }
    return Promise.reject(error);
  }
);
```

**Error Types Handled:**
1. **Timeout**: Request took longer than 30 seconds
2. **Server Error**: Backend returned error (uses error message from response)
3. **Connection Error**: No response from server (backend not running)

#### API Functions

##### `getMajors()`
- **Method**: GET
- **Endpoint**: `/api/majors`
- **Returns**: Array of major objects
- **Usage**: Currently unused (future: major selection)

##### `getMajorCourses(majorName)`
- **Method**: GET
- **Endpoint**: `/api/majors/{majorName}/courses`
- **URL Encoding**: Uses `encodeURIComponent()` for major name
- **Returns**: `{required: [], electives: [], focus_areas: []}`
- **Usage**: Called on app mount to load courses

##### `getRecommendations(majorName, completedCourses, numRecommendations)`
- **Method**: POST
- **Endpoint**: `/api/recommend`
- **Request Body**:
  ```json
  {
    "major_name": "Computer Science, BS",
    "completed_courses": ["CS 124", "MATH 221"],
    "num_recommendations": 10
  }
  ```
- **Returns**: Full recommendation response
- **Usage**: Called when user clicks "Get Recommendations"

##### `getCourseDetails(courseCode)`
- **Method**: GET
- **Endpoint**: `/api/courses/{courseCode}`
- **URL Encoding**: Uses `encodeURIComponent()` for course code
- **Returns**: Full course object
- **Usage**: Called when user clicks a course card

##### `getCoursePrerequisites(courseCode)`
- **Method**: GET
- **Endpoint**: `/api/courses/{courseCode}/prerequisites`
- **Returns**: Prerequisite information
- **Usage**: Currently unused (future: prerequisite visualization)

### API Call Patterns

**Pattern 1: Load on Mount**
```javascript
useEffect(() => {
  loadMajorCourses();
}, []);
```

**Pattern 2: Load on User Action**
```javascript
const handleGetRecommendations = async () => {
  try {
    setLoading(true);
    const response = await getRecommendations(...);
    setRecommendations(response.recommendations);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**Pattern 3: Load on Prop Change**
```javascript
useEffect(() => {
  if (courseCode) {
    loadCourseDetails();
  }
}, [courseCode]);
```

---

## User Flows

### Flow 1: Initial Load → Course Selection

1. **User opens app** → `App` component mounts
2. **`useEffect` triggers** → `loadMajorCourses()` called
3. **API call** → `getMajorCourses('Computer Science, BS')`
4. **State update** → `courses` populated
5. **Screen change** → User clicks "Get Started"
6. **Screen renders** → `CourseSelector` displays all courses
7. **User searches/filters** → Real-time filtering via `useMemo`
8. **User selects courses** → `selectedCourses` state updates
9. **Button enabled** → "Get Recommendations" button becomes active

### Flow 2: Getting Recommendations

1. **User clicks "Get Recommendations"** → `handleGetRecommendations()` called
2. **Validation** → `validateAndNormalizeCourses()` filters invalid codes
3. **Error check** → If no valid courses, shows error and returns
4. **Loading state** → `loading` set to `true`
5. **API call** → `getRecommendations(majorName, courses, 10)`
6. **Response received** → Updates multiple states:
   - `recommendations`
   - `progress`
   - `semesterPlan`
   - `studentYear`
7. **Screen change** → `screen` set to `'recommendations'`
8. **UI renders** → Shows progress bar, semester plan, recommendations
9. **Loading state** → `loading` set to `false`

### Flow 3: Viewing Course Details

1. **User clicks course card** → `handleCourseClick(courseCode)` called
2. **State update** → `selectedCourseDetails` set to course code
3. **Modal renders** → `CourseDetails` component mounts
4. **`useEffect` triggers** → `loadCourseDetails()` called
5. **API call** → `getCourseDetails(courseCode)`
6. **Loading state** → Shows "Loading..." message
7. **Response received** → `course` state populated
8. **UI renders** → Displays full course information
9. **User closes** → Clicks X or outside modal
10. **State update** → `selectedCourseDetails` set to `null`
11. **Modal unmounts** → `CourseDetails` component removed

### Flow 4: Starting Over

1. **User clicks "Start Over"** → Handler function called
2. **State reset** → All recommendation-related states cleared:
   - `selectedCourses` → `[]`
   - `recommendations` → `[]`
   - `progress` → `{completed: 0, total: 0, percentage: 0}`
   - `semesterPlan` → `null`
   - `studentYear` → `null`
3. **Screen change** → `screen` set to `'course-selection'`
4. **UI renders** → Returns to course selection screen

---

## Styling System

### CSS Architecture

**Approach**: Component-scoped CSS files (no CSS-in-JS or CSS modules)

**Structure:**
- `App.css`: Main app styles, screen containers
- `index.css`: Global styles, resets, variables
- Component CSS: Each component has its own `.css` file

### Styling Patterns

#### 1. Screen Containers
```css
.screen-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
```

#### 2. Card Layouts
```css
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
```

#### 3. Responsive Design
```css
@media (max-width: 768px) {
  .semester-grid {
    grid-template-columns: 1fr;
  }
}
```

### CSS Classes

#### App Component Classes
- `.app`: Root container
- `.screen-container`: Screen wrapper
- `.welcome-screen`: Welcome screen styles
- `.course-selection-screen`: Course selection screen
- `.recommendations-screen`: Recommendations screen
- `.action-buttons`: Button container
- `.error-message`: Error display
- `.loading`: Loading indicator
- `.year-indicator`: Student year badge

#### CourseSelector Classes
- `.course-selector`: Main container
- `.course-selector-controls`: Search and filter controls
- `.course-search`: Search input
- `.dept-filter`: Department dropdown
- `.selected-count`: Selection counter
- `.clear-selection`: Clear button
- `.courses-list`: Course list container
- `.course-item`: Individual course row
- `.course-item.selected`: Selected course styling
- `.course-info`: Course information container
- `.course-code`: Course code display
- `.course-name`: Course name display
- `.course-credits`: Credits display

#### Recommendations Classes
- `.recommendations`: Main container
- `.recommendations-title`: Section title
- `.recommendations-subtitle`: Section subtitle
- `.recommendations-grid`: Grid layout
- `.recommendation-card`: Individual card
- `.recommendation-header`: Card header
- `.recommendation-number`: Rank number
- `.recommendation-code`: Course code
- `.recommendation-name`: Course name
- `.recommendation-details`: Details section
- `.recommendation-credits`: Credits display
- `.recommendation-reason`: Reason display
- `.prereq-status`: Prerequisite status
- `.missing-prereq-status`: Missing prerequisites

#### ProgressBar Classes
- `.progress-container`: Main container
- `.progress-header`: Header section
- `.progress-text`: Progress text
- `.progress-bar-wrapper`: Bar container
- `.progress-bar-fill`: Filled portion
- `.progress-percentage`: Percentage text

#### SemesterPlan Classes
- `.semester-plan`: Main container
- `.semester-plan-title`: Section title
- `.semester-grid`: Grid layout
- `.semester-card`: Semester card
- `.fall-semester`: Fall semester styling
- `.spring-semester`: Spring semester styling
- `.semester-header`: Card header
- `.credit-badge`: Credit total badge
- `.semester-courses`: Course list
- `.semester-course`: Individual course
- `.other-courses`: Other courses section
- `.other-courses-list`: Other courses container
- `.other-course-tag`: Course code tag

#### CourseDetails Classes
- `.course-details-overlay`: Modal backdrop
- `.course-details-modal`: Modal container
- `.close-button`: Close button
- `.course-details-content`: Content container
- `.course-details-code`: Course code
- `.course-details-name`: Course name
- `.course-details-section`: Section container
- `.section-label`: Label text
- `.section-value`: Value text
- `.prerequisites-list`: Prerequisites container
- `.prerequisite-tag`: Prerequisite tag
- `.postrequisites-list`: Postrequisites container
- `.postrequisite-tag`: Postrequisite tag
- `.more-courses`: "More" indicator
- `.course-link`: External link

### Color Scheme

**Primary Colors:**
- Primary blue: `#1976d2`
- Success green: `#4caf50`
- Warning orange: `#ff9800`
- Error red: `#f44336`

**Semester Colors:**
- Fall: Orange theme (`#ff9800`)
- Spring: Green theme (`#4caf50`)

**Background:**
- Light gray: `#f5f5f5`
- White: `#ffffff`
- Dark overlay: `rgba(0, 0, 0, 0.5)`

### Responsive Breakpoints

- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `> 1024px`

---

## Utilities

### Validation Utilities (`src/utils/validation.js`)

#### `validateCourseCode(code)`
**Purpose**: Validates course code format

**Pattern**: `^[A-Z]{2,4}\s+\d{3}[A-Z]?$`

**Examples:**
- ✅ Valid: `"CS 124"`, `"MATH 221"`, `"ENG 100A"`
- ❌ Invalid: `"CS124"` (no space), `"CS 12"` (too short), `"CS 1245"` (too long)

**Implementation:**
```javascript
export const validateCourseCode = (code) => {
  if (!code || typeof code !== 'string') {
    return false;
  }
  const pattern = /^[A-Z]{2,4}\s+\d{3}[A-Z]?$/i;
  return pattern.test(code.trim());
};
```

#### `normalizeCourseCode(code)`
**Purpose**: Normalizes course code to standard format

**Transformations:**
- Trims whitespace
- Converts to uppercase
- Ensures format: `"DEPT 123"` (not `"DEPT123"`)

**Examples:**
- `"cs 124"` → `"CS 124"`
- `"MATH  221"` → `"MATH 221"`
- `"ENG100"` → `"ENG 100"`

**Implementation:**
```javascript
export const normalizeCourseCode = (code) => {
  if (!code) return '';
  const normalized = code.trim().toUpperCase();
  const match = normalized.match(/^([A-Z]{2,4})\s*(\d{3}[A-Z]?)$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  return normalized;
};
```

#### `validateAndNormalizeCourses(courses)`
**Purpose**: Batch validation and normalization

**Process:**
1. Maps each code through `normalizeCourseCode()`
2. Filters out invalid codes using `validateCourseCode()`
3. Returns array of valid, normalized codes

**Usage:**
```javascript
const validCourses = validateAndNormalizeCourses(['cs 124', 'MATH 221', 'invalid']);
// Returns: ['CS 124', 'MATH 221']
```

---

## Build & Deployment

### Development

**Start Development Server:**
```bash
cd Project/Frontend
npm install  # First time only
npm run dev
```

**Access**: `http://localhost:5173`

**Features:**
- Hot Module Replacement (HMR)
- Fast refresh
- Source maps
- Error overlay

### Production Build

**Build Command:**
```bash
npm run build
```

**Output**: `dist/` directory with:
- `index.html`: Entry point
- `assets/`: Bundled JavaScript and CSS
- Static assets

**Build Process:**
1. Vite bundles all JavaScript
2. CSS is extracted and minified
3. Assets are optimized
4. Code is tree-shaken (unused code removed)

### Environment Variables

**File**: `.env` (create in `Frontend/` directory)

**Variables:**
```env
VITE_API_URL=http://localhost:8000
```

**Usage**: Accessed via `import.meta.env.VITE_API_URL`

**Note**: Only variables prefixed with `VITE_` are exposed to client code

### Deployment Options

#### Option 1: Static Hosting
- **Netlify**: Drag and drop `dist/` folder
- **Vercel**: Connect GitHub repo, auto-deploy
- **GitHub Pages**: Deploy `dist/` to `gh-pages` branch

#### Option 2: Server Deployment
- Upload `dist/` to web server (Apache, Nginx)
- Configure server to serve `index.html` for all routes
- Set up reverse proxy for API calls

#### Option 3: Docker
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html
EXPOSE 80
```

### Linting

**Run Linter:**
```bash
npm run lint
```

**Configuration**: `eslint.config.js`

**Rules**: React hooks, refresh plugin, standard JavaScript

---

## Key Design Decisions

### 1. No Routing Library
**Decision**: Use state-based screen management instead of React Router

**Rationale:**
- Simple application with only 3 screens
- No need for URL routing
- Reduces dependencies
- Easier to understand

**Trade-off**: No browser back/forward button support, no shareable URLs

### 2. No State Management Library
**Decision**: Use React's built-in `useState` instead of Redux/Context

**Rationale:**
- Small application size
- State is mostly local to `App` component
- Simpler mental model
- Fewer dependencies

**Trade-off**: Could become complex if app grows significantly

### 3. Component-Scoped CSS
**Decision**: Separate CSS files instead of CSS-in-JS

**Rationale:**
- Easier to maintain
- Better IDE support
- No runtime CSS generation
- Familiar to most developers

**Trade-off**: No automatic scoping (need to be careful with class names)

### 4. Hardcoded Major
**Decision**: Major is hardcoded to "Computer Science, BS"

**Rationale:**
- MVP focus
- Simplifies initial implementation
- Can be extended later

**Future**: Add major selection dropdown

### 5. No Authentication
**Decision**: No user accounts or authentication

**Rationale:**
- MVP requirement
- Simplifies development
- No backend auth needed

**Future**: Could add user accounts for saving plans

---

## Future Enhancements

### Short-term
1. **Major Selection**: Dropdown to select different majors
2. **Save Plans**: localStorage to save course selections
3. **Prerequisite Visualization**: Visual graph of course dependencies
4. **Gen Ed Tracking**: Track General Education requirements

### Medium-term
1. **User Accounts**: Authentication and user profiles
2. **Multiple Plans**: Save multiple course plans
3. **Export**: Export plans to PDF or calendar
4. **Notifications**: Reminders for registration deadlines

### Long-term
1. **ML Integration**: Use machine learning for better recommendations
2. **Social Features**: Share plans with advisors/peers
3. **Course Reviews**: Student reviews and ratings
4. **Schedule Builder**: Visual schedule builder with time conflicts

---

## Troubleshooting

### Common Issues

#### 1. "Unable to connect to server"
**Cause**: Backend not running
**Solution**: Start backend server on port 8000

#### 2. "No courses found"
**Cause**: Major not found or API error
**Solution**: Check backend logs, verify major name

#### 3. CORS Errors
**Cause**: Backend CORS not configured
**Solution**: Check backend CORS settings in `main.py`

#### 4. Build Errors
**Cause**: Missing dependencies or syntax errors
**Solution**: Run `npm install`, check console for errors

#### 5. Styling Issues
**Cause**: CSS not loading or class name typos
**Solution**: Check browser console, verify CSS imports

---

## Conclusion

The frontend is a well-structured React application that provides a clean, intuitive interface for course recommendations. It uses modern React patterns, efficient state management, and a component-based architecture that makes it easy to understand and extend.

**Key Strengths:**
- Simple, maintainable codebase
- Clear component separation
- Good error handling
- Responsive design
- Fast development experience

**Areas for Growth:**
- Add routing for shareable URLs
- Implement state persistence
- Add more majors
- Enhance with user accounts

The codebase is ready for team collaboration and future enhancements!

