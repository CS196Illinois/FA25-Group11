# Implementation Plan: Enhanced Recommendation System

## Overview

This plan outlines how to integrate the official UIUC CS degree requirements and sample sequence into our recommendation system, and whether to use ML/LLM models.

## Decision Summary

### ✅ Use Degree Requirements + Sample Sequence
**YES** - Both are essential:
- **Degree Requirements**: Tell us WHAT courses are needed
- **Sample Sequence**: Tell us WHEN courses should be taken

### 🤖 ML/LLM Strategy
**Hybrid Approach:**
- **Core System**: Enhanced rule-based (reliable, fast, explainable)
- **Optional Enhancement**: LLM for natural language explanations (future)

**No ML model needed initially** - Rule-based works well with proper sequence integration.

## Phase 1: Enhanced Rule-Based System

### 1.1 Parse and Store Sample Sequence

**Source:** [UIUC CS Catalog - Sample Sequence](https://catalog.illinois.edu/undergraduate/engineering/computer-science-bs/#samplesequencetext)

**Structure:**
```json
{
  "sample_sequence": {
    "first_year": {
      "fall": ["CS 124", "MATH 221", "ENG 100", ...],
      "spring": ["CS 128", "CS 173", "MATH 231", ...]
    },
    ...
  }
}
```

**Implementation:**
- Create parser for sample sequence table
- Store in `major_requirements.json` or separate file
- Link courses to specific semesters

### 1.2 Enhance Recommender with Sequence Logic

**New Features:**
1. **Year Detection**
   ```python
   def detect_student_year(completed_courses):
       # Count completed core courses
       # Return: "first_year", "second_year", "third_year", "fourth_year"
   ```

2. **Sequence Alignment Scoring**
   ```python
   def get_sequence_score(course_code, student_year, semester):
       # Check if course is in sample sequence for this year/semester
       # Return: 0.0 (not in sequence) to 1.0 (perfect match)
   ```

3. **Semester Grouping**
   ```python
   def group_by_semester(recommendations, student_year):
       # Group courses into fall/spring semesters
       # Balance credit hours (12-18 per semester)
   ```

### 1.3 Update Recommendation Algorithm

**New Ranking Criteria:**
1. Prerequisites met (existing)
2. **Sequence alignment** (NEW - prioritize courses in sample sequence)
3. Required vs elective (existing)
4. Course level (existing)
5. **Semester timing** (NEW - suggest fall courses in fall, spring in spring)
6. **Credit hour balance** (NEW - avoid overloading)

**Priority Order:**
```
1. Prerequisites satisfied
2. Sequence alignment (in sample sequence for current year)
3. Required courses
4. Course level (lower first)
5. Postrequisite count
```

### 1.4 Frontend Updates

**New Features:**
1. **Semester View**
   - Show recommendations grouped by semester
   - Display credit hours per semester
   - Show progress toward 128 total hours

2. **Year Indicator**
   - Display detected student year
   - Show which courses align with sample sequence

3. **Requirement Tracking**
   - Track Gen Ed requirements
   - Track credit hours by category
   - Show what's completed vs. remaining

## Phase 2: Optional LLM Enhancement

### 2.1 LLM for Explanations Only

**Use Cases:**
- Generate natural language explanations for recommendations
- Answer "Why this course?" questions
- Provide personalized study tips
- Explain prerequisite chains

**Not Used For:**
- Core recommendation logic (keep rule-based)
- Prerequisite validation
- Course selection

### 2.2 Implementation

**API Integration:**
- OpenAI GPT-4 or Anthropic Claude
- Generate explanations on-demand
- Cache common explanations

**Example:**
```python
def generate_explanation(course, student_profile):
    prompt = f"""
    Student has completed: {student_profile.completed}
    Recommended course: {course.code} - {course.name}
    
    Explain why this course is recommended, considering:
    - Prerequisites met
    - Sample sequence alignment
    - Major requirements
    - Student's progress
    """
    return llm.generate(prompt)
```

## Technical Implementation

### Step 1: Parse Sample Sequence

**File:** `data_scraping/scripts/parse_sample_sequence.py`

```python
def parse_sample_sequence(major_name):
    # Scrape or parse sample sequence from catalog
    # Return structured sequence data
    pass
```

### Step 2: Update Data Structure

**File:** `data_scraping/output/ml_ready/major_requirements.json`

Add to each major:
```json
{
  "major_name": "Computer Science, BS",
  "sample_sequence": { ... },
  "requirement_groups": [ ... ]
}
```

### Step 3: Enhance Recommender

**File:** `backend/app/services/recommender.py`

Add methods:
- `detect_student_year()`
- `get_sequence_alignment()`
- `group_by_semester()`
- `balance_workload()`

### Step 4: Update API

**File:** `backend/app/api/routes.py`

New endpoint:
```python
@router.post("/recommend-semester")
async def get_semester_recommendations(request):
    # Return recommendations grouped by semester
    pass
```

### Step 5: Update Frontend

**File:** `Frontend/src/components/Recommendations.jsx`

Add:
- Semester grouping display
- Credit hour totals
- Year indicator
- Sequence alignment badges

## Workflow Diagram

```
User Input (Completed Courses)
    ↓
Detect Student Year
    ↓
Load Sample Sequence for Year
    ↓
Filter Courses:
  - Prerequisites met ✓
  - In sample sequence ✓
  - Required/elective status ✓
    ↓
Rank by Priority:
  1. Sequence alignment
  2. Required courses
  3. Course level
    ↓
Group by Semester
    ↓
Balance Workload (12-18 credits)
    ↓
Return Recommendations
```

## Benefits of This Approach

### Rule-Based Foundation
- ✅ Reliable and deterministic
- ✅ Explainable (can show why each course is recommended)
- ✅ Fast (no API calls needed)
- ✅ No training data required

### Sample Sequence Integration
- ✅ Aligns with official UIUC curriculum
- ✅ Provides temporal guidance
- ✅ Helps with semester planning
- ✅ Balances workload

### Optional LLM Enhancement
- ✅ Natural language explanations
- ✅ Personalized advice
- ✅ Q&A functionality
- ✅ Doesn't compromise reliability

## Timeline

### Week 1: Parse Sample Sequence
- Create parser for sample sequence
- Store in data structure
- Test with CS major

### Week 2: Enhance Recommender
- Add year detection
- Add sequence alignment
- Add semester grouping
- Update ranking algorithm

### Week 3: Update Frontend
- Add semester view
- Add credit hour tracking
- Add year indicator
- Test UI

### Week 4: Testing & Refinement
- Test with various student profiles
- Refine algorithm
- Add edge case handling
- Documentation

### Future: LLM Integration (Optional)
- Integrate LLM API
- Generate explanations
- Add Q&A feature
- Monitor costs

## Success Metrics

1. **Accuracy**: Recommendations align with sample sequence 80%+ of the time
2. **Completeness**: All required courses recommended by appropriate year
3. **Balance**: Credit hours per semester between 12-18
4. **User Satisfaction**: Students find recommendations helpful

## Conclusion

**Recommended Approach:**
- ✅ Use degree requirements (already have)
- ✅ Use sample sequence (add now)
- ✅ Enhanced rule-based system (implement)
- ⏸️ LLM for explanations (optional, future)

This provides a reliable, explainable, and well-aligned recommendation system that follows the official UIUC curriculum while remaining flexible for individual student needs.

