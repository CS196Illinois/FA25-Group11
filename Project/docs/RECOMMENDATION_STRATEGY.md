# Recommendation System Strategy

## Current System Analysis

### What We Have
- **Rule-based system** using prerequisites and major requirements
- **7,968 courses** with prerequisite/postrequisite relationships
- **316 majors** with structured requirement groups
- **Prerequisite validation** with OR logic
- **Course level filtering** (100/200 before 300/400)

### Current Limitations
1. **No temporal sequencing** - Doesn't consider when courses should be taken
2. **No semester planning** - Doesn't group courses by semester
3. **No workload balancing** - Doesn't consider credit hours per semester
4. **Generic recommendations** - Same logic for all students regardless of year
5. **No sample sequence integration** - Doesn't use the official 4-year plan

## Proposed Workflow

### Phase 1: Enhanced Rule-Based System (Immediate)

**Incorporate Sample Sequence:**
- Parse and store the official 4-year sample sequence from catalog
- Use sequence to suggest courses by academic year/semester
- Prioritize courses that align with sample sequence timing

**Workflow:**
```
1. User selects completed courses
2. System determines student's current year (based on completed courses)
3. System loads sample sequence for that year
4. System filters courses by:
   - Prerequisites met
   - Sample sequence timing
   - Course level appropriateness
5. System groups recommendations by semester
6. System balances workload (credit hours per semester)
```

### Phase 2: Hybrid ML Approach (Future)

**Why ML/LLM?**
- **LLM**: Natural language explanations, personalized advice
- **ML Model**: Learn from successful student paths, predict course difficulty/workload
- **Hybrid**: Combine rule-based (reliable) with ML (adaptive)

**Recommended Approach: Hybrid System**

```
Rule-Based (70%) + ML Enhancement (30%)
├── Rule-based: Prerequisites, requirements, sample sequence
├── ML Model: Course difficulty prediction, workload estimation
└── LLM: Natural language explanations, personalized guidance
```

## Detailed Workflow Design

### 1. Data Integration

**Sample Sequence Structure:**
```json
{
  "sample_sequence": {
    "first_year": {
      "fall": ["CS 124", "MATH 221", "ENG 100", ...],
      "spring": ["CS 128", "CS 173", "MATH 231", ...]
    },
    "second_year": { ... },
    "third_year": { ... },
    "fourth_year": { ... }
  }
}
```

**Degree Requirements:**
- Already have this in `major_requirements.json`
- Need to enhance with:
  - Credit hour requirements per category
  - Gen Ed requirements tracking
  - Technical GPA requirements

### 2. Student State Detection

**Determine Student Year:**
```python
def detect_student_year(completed_courses):
    # Count completed core courses
    core_courses = ['CS 124', 'CS 128', 'CS 173', 'CS 225', 'CS 233', ...]
    completed_core = count_completed(completed_courses, core_courses)
    
    if completed_core < 2:
        return "first_year"
    elif completed_core < 5:
        return "second_year"
    elif completed_core < 8:
        return "third_year"
    else:
        return "fourth_year"
```

### 3. Recommendation Generation

**Multi-Stage Filtering:**
1. **Prerequisite Check** - Can student take this course?
2. **Sequence Alignment** - Is this course in the sample sequence for their year?
3. **Requirement Status** - Is this course required or elective?
4. **Workload Balance** - Does this fit with other recommended courses?
5. **Credit Hours** - Does this help meet credit requirements?

### 4. Semester Planning

**Group by Semester:**
- Fall semester recommendations
- Spring semester recommendations
- Show credit hour totals per semester
- Balance workload (avoid all hard courses together)

## ML/LLM Strategy

### Option 1: Pure Rule-Based (Current + Enhanced)
**Pros:**
- Reliable and explainable
- No training data needed
- Fast and deterministic
- Easy to debug

**Cons:**
- Not adaptive to individual student needs
- Can't learn from successful paths
- Limited personalization

**Best for:** MVP, reliable recommendations

### Option 2: Hybrid Rule + ML
**Components:**
- **Rule-based engine** (70%): Prerequisites, requirements, sequence
- **ML model** (20%): Course difficulty/workload prediction
- **LLM** (10%): Natural language explanations

**ML Model Options:**
1. **Collaborative Filtering**: Learn from similar students' paths
2. **Regression Model**: Predict course difficulty/workload
3. **Classification Model**: Predict course success probability

**LLM Usage:**
- Generate personalized explanations
- Answer questions about course choices
- Provide study tips and advice

**Pros:**
- Best of both worlds
- Adaptive and personalized
- Still reliable (rule-based foundation)

**Cons:**
- More complex
- Requires training data
- LLM API costs

**Best for:** Production system with user data

### Option 3: Pure LLM-Based
**Pros:**
- Very flexible
- Natural language understanding
- Can handle complex queries

**Cons:**
- Expensive (API costs)
- Unreliable (hallucinations)
- Slow
- Hard to validate

**Not recommended** for core recommendations

## Recommended Approach: Enhanced Rule-Based + Optional LLM

### Phase 1: Enhanced Rule-Based (Implement Now)

**What to Add:**
1. **Sample Sequence Integration**
   - Parse sample sequence from catalog
   - Store in major_requirements.json
   - Use to prioritize courses by year/semester

2. **Semester Planning**
   - Group recommendations by semester
   - Balance credit hours (12-18 per semester)
   - Consider course difficulty/workload

3. **Requirement Tracking**
   - Track Gen Ed requirements
   - Track credit hours by category
   - Show progress toward 128 hours

4. **Year-Based Recommendations**
   - Different logic for first-year vs. fourth-year students
   - Prioritize foundational courses early
   - Prioritize advanced electives later

### Phase 2: Optional LLM Enhancement (Future)

**LLM for Explanations Only:**
- Use LLM to generate natural language explanations
- "Why this course?" - Personalized reasoning
- "What if I take X instead of Y?" - Alternative analysis
- Study tips and preparation advice

**Not for Core Logic:**
- Keep rule-based for actual recommendations
- Use LLM only for explanations and Q&A

## Implementation Plan

### Step 1: Parse Sample Sequence
- Extract sample sequence from catalog page
- Store in structured format
- Integrate with existing major_requirements.json

### Step 2: Enhance Recommender
- Add year detection logic
- Add sequence alignment scoring
- Add semester grouping

### Step 3: Update Frontend
- Show recommendations by semester
- Display credit hour totals
- Show progress toward requirements

### Step 4: (Optional) Add LLM
- Integrate OpenAI/Anthropic API
- Generate explanations for recommendations
- Add Q&A feature

## Decision: Use Degree Requirements + Sample Sequence

**YES - Use Both:**

1. **Degree Requirements** (Already using):
   - ✅ Required courses
   - ✅ Prerequisites
   - ✅ Credit hours
   - ✅ Category requirements

2. **Sample Sequence** (Add now):
   - ✅ Temporal ordering
   - ✅ Semester planning
   - ✅ Year-based recommendations
   - ✅ Workload balancing

**Why Both:**
- Requirements tell us WHAT courses are needed
- Sequence tells us WHEN courses should be taken
- Together they provide complete guidance

## ML/LLM Decision

**Recommendation: Enhanced Rule-Based + Optional LLM**

**Core System:** Rule-based (reliable, fast, explainable)
- Prerequisites
- Requirements
- Sample sequence
- Semester planning

**Enhancement:** LLM for explanations (optional, future)
- Natural language reasoning
- Personalized advice
- Q&A functionality

**No ML Model Needed (Yet):**
- Don't have training data
- Rule-based works well
- Can add later if needed

## Next Steps

1. **Parse sample sequence** from catalog
2. **Enhance recommender** with sequence logic
3. **Add semester planning** to frontend
4. **Test with real student scenarios**
5. **Consider LLM** for explanations (optional)

