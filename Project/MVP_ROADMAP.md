# MVP Roadmap: Course Recommendation System

## Goal
Build a working course recommendation system for **Computer Science majors** that suggests courses based on what they've already taken.

---

## What You Have (Ready to Use)

✅ **`scrape_courses/all_courses.csv`** - Every UIUC course with prerequisites
✅ **`scrape_majors/cs_major_simple.json`** - CS major requirements (simplified)
✅ **`grainger_majors/`** - Curriculum maps (optional, for validation)

---

## MVP Feature Set

### Core Features
1. **Input:** User selects courses they've completed
2. **Output:** System recommends 5 courses for next semester
3. **Logic:**
   - Only recommend courses where prerequisites are satisfied
   - Prioritize required courses not yet taken
   - Fill remaining slots with popular electives

### Nice-to-Have (Phase 2)
- Degree progress tracker (% complete)
- Semester-by-semester planning
- Focus area recommendations
- Course difficulty/workload ratings

---

## Technical Architecture

### 1. Data Processing Pipeline
```
all_courses.csv + cs_major_simple.json
    ↓
Clean & merge data
    ↓
Create prerequisite graph
    ↓
Feature engineering
    ↓
Training data (if using ML)
```

### 2. ML Model Options

**Option A: Rule-Based (Easiest, Start Here)**
- No ML needed initially
- Simple algorithm:
  1. Filter courses by prerequisites met
  2. Rank by: required > popular electives > other
  3. Return top 5

**Option B: Collaborative Filtering (Next Step)**
- "Students who took X, Y, Z also took A, B, C"
- Needs: Historical enrollment data OR simulated data
- Can use simple cosine similarity

**Option C: Deep Learning (Future)**
- Graph Neural Network on prerequisite graph
- Predict course sequence success
- Needs: More data (grades, outcomes, etc.)

### 3. Website Stack Suggestions

**Simple Stack:**
- Frontend: React (or Next.js)
- Backend: Flask/FastAPI (Python) or Node.js
- Database: SQLite (for MVP) → PostgreSQL (later)
- Hosting: Vercel (frontend) + Render/Railway (backend)

**Super Simple (No Backend):**
- Just React + all data loaded client-side
- Works fine for CS major only
- No user accounts needed

---

## MVP Development Steps

### Week 1: Data Preparation
- [ ] Load `all_courses.csv` into pandas
- [ ] Load `cs_major_simple.json`
- [ ] Create prerequisite graph (course → required prereqs)
- [ ] Create course lists (required vs electives)
- [ ] Test: Given completed courses, find all "takeable" courses

### Week 2: Recommendation Logic
- [ ] Implement rule-based recommender
- [ ] Test with example student profiles:
  - Freshman (completed: CS 124, MATH 221)
  - Sophomore (completed: CS 124, 128, 173, 225, MATH 221, 231, 241)
  - Junior (completed all core, needs electives)
- [ ] Validate recommendations make sense

### Week 3: Basic Website
- [ ] Create React app
- [ ] Build course selection UI (checkboxes for completed courses)
- [ ] Display recommendations
- [ ] Show prerequisite chains (visual tree?)
- [ ] Deploy to Vercel

### Week 4: Polish & Expand
- [ ] Add degree progress bar
- [ ] Improve UI/UX
- [ ] Test with real students
- [ ] Add 1-2 more majors if time permits

---

## Starter Code Structure

```
Project/
├── data/
│   ├── all_courses.csv          (you have this)
│   ├── cs_major_simple.json     (you have this)
│   └── processed/               (generated)
│       ├── prereq_graph.json
│       └── course_features.csv
│
├── backend/                     (Python)
│   ├── data_loader.py          (load & clean data)
│   ├── prereq_checker.py       (check if prereqs met)
│   ├── recommender.py          (recommendation logic)
│   └── api.py                  (Flask/FastAPI routes)
│
├── frontend/                    (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── CourseSelector.jsx
│   │   │   ├── Recommendations.jsx
│   │   │   └── ProgressBar.jsx
│   │   └── App.jsx
│   └── package.json
│
└── notebooks/                   (Jupyter, for experiments)
    └── explore_data.ipynb
```

---

## Quick Start: Build the Recommender First

Want me to help you build the core recommendation logic first? We can:

1. **Load your course data** into a usable format
2. **Build prerequisite checker** (given completed courses, what can they take?)
3. **Implement simple recommender** (rank courses by required > popular > other)
4. **Test it** with example students

Then you can build the website around it.

---

## Questions to Answer

Before starting, decide:

1. **Target users:** Just CS majors? Or multi-major from the start?
   - **Recommendation:** Start with CS only

2. **User accounts:** Do students need to log in and save progress?
   - **Recommendation:** No accounts for MVP (just one-time use)

3. **Semester planning:** Just "next semester" or full 4-year plan?
   - **Recommendation:** Just next semester for MVP

4. **ML or rules:** Start with ML or simple rules?
   - **Recommendation:** Simple rules first, add ML later

---

## What do you want to build first?

A) **Data pipeline** - Load and process the course data
B) **Recommender logic** - Build the recommendation algorithm
C) **Website prototype** - Start with frontend and mock data
D) **Full stack together** - Backend + frontend simultaneously

Let me know and I'll help you get started!
