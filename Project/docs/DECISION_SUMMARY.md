# Recommendation System: Decision Summary

## Executive Summary

After analyzing the [UIUC CS degree requirements](https://catalog.illinois.edu/undergraduate/engineering/computer-science-bs/#degreerequirementstext) and [sample sequence](https://catalog.illinois.edu/undergraduate/engineering/computer-science-bs/#samplesequencetext), here are the key decisions:

## ✅ Decision 1: Use Degree Requirements + Sample Sequence

**YES - Use Both**

### Degree Requirements (Already Using)
- ✅ Required courses (CS core, Math, Physics)
- ✅ Prerequisites relationships
- ✅ Credit hour requirements (128 total)
- ✅ Category requirements (Gen Ed, Technical, Advanced electives)

**Source:** [Degree Requirements](https://catalog.illinois.edu/undergraduate/engineering/computer-science-bs/#degreerequirementstext)

### Sample Sequence (Add Now)
- ✅ Temporal ordering (when courses should be taken)
- ✅ Semester-by-semester plan (Fall/Spring)
- ✅ Year-based progression (First → Fourth year)
- ✅ Workload balancing (12-18 credits per semester)

**Source:** [Sample Sequence](https://catalog.illinois.edu/undergraduate/engineering/computer-science-bs/#samplesequencetext)

### Why Both?
- **Requirements** tell us **WHAT** courses are needed
- **Sequence** tells us **WHEN** courses should be taken
- Together they provide complete academic guidance

## ✅ Decision 2: ML/LLM Strategy

**Recommended: Enhanced Rule-Based + Optional LLM**

### Core System: Rule-Based (70%)
- ✅ Prerequisites validation
- ✅ Requirements checking
- ✅ Sample sequence alignment
- ✅ Semester planning
- ✅ Workload balancing

**Why Rule-Based?**
- Reliable and deterministic
- Fast (no API calls)
- Explainable (can show reasoning)
- No training data needed
- Easy to debug and maintain

### Optional Enhancement: LLM (30%)
- ⏸️ Natural language explanations
- ⏸️ Personalized study tips
- ⏸️ Q&A functionality
- ⏸️ Alternative course analysis

**Why LLM (Optional)?**
- Can generate human-like explanations
- Handles complex questions
- Provides personalized advice
- **BUT**: Expensive, slower, can hallucinate

**Decision: Use LLM only for explanations, NOT for core recommendations**

### ML Model: Not Needed (Yet)
- ❌ No training data available
- ❌ Rule-based works well
- ❌ Can add later if needed

## Proposed Workflow

### Current Workflow (Rule-Based Only)
```
User Input → Prerequisites Check → Rank by Level → Return Top N
```

### Enhanced Workflow (With Sample Sequence)
```
User Input (Completed Courses)
    ↓
Detect Student Year (First/Second/Third/Fourth)
    ↓
Load Sample Sequence for Detected Year
    ↓
Filter Courses:
  ✓ Prerequisites met
  ✓ In sample sequence for current year
  ✓ Required vs elective status
    ↓
Rank by Priority:
  1. Sequence alignment (in sample sequence)
  2. Required courses
  3. Course level (100/200 before 300/400)
  4. Postrequisite count
    ↓
Group by Semester (Fall/Spring)
    ↓
Balance Workload (12-18 credits per semester)
    ↓
Return Recommendations with Semester Groups
```

## Implementation Priority

### Phase 1: Enhanced Rule-Based (Implement Now) ⚡
1. **Parse Sample Sequence**
   - Extract from catalog
   - Store in structured format
   - Link to major requirements

2. **Add Year Detection**
   - Analyze completed courses
   - Determine student year
   - Load appropriate sequence

3. **Enhance Recommender**
   - Add sequence alignment scoring
   - Add semester grouping
   - Add workload balancing

4. **Update Frontend**
   - Show recommendations by semester
   - Display credit hours per semester
   - Show year indicator

### Phase 2: Optional LLM (Future) 🔮
1. Integrate LLM API (OpenAI/Anthropic)
2. Generate explanations for recommendations
3. Add Q&A feature
4. Monitor costs and usage

## Key Features to Add

### 1. Sample Sequence Integration
```python
def get_sequence_alignment(course_code, student_year, semester):
    """Check if course aligns with sample sequence"""
    sequence = load_sample_sequence(major, student_year)
    return course_code in sequence[semester]
```

### 2. Year Detection
```python
def detect_student_year(completed_courses):
    """Determine student's academic year"""
    core_courses = ['CS 124', 'CS 128', 'CS 173', 'CS 225', ...]
    completed_core = count_completed(completed_courses, core_courses)
    
    if completed_core < 2: return "first_year"
    elif completed_core < 5: return "second_year"
    elif completed_core < 8: return "third_year"
    else: return "fourth_year"
```

### 3. Semester Planning
```python
def group_by_semester(recommendations, student_year):
    """Group courses into fall/spring semesters"""
    sequence = load_sample_sequence(major, student_year)
    fall_courses = [c for c in recommendations if c in sequence['fall']]
    spring_courses = [c for c in recommendations if c in sequence['spring']]
    return {'fall': fall_courses, 'spring': spring_courses}
```

### 4. Workload Balancing
```python
def balance_workload(semester_courses, target_credits=15):
    """Ensure semester has 12-18 credit hours"""
    total_credits = sum(course.credits for course in semester_courses)
    if total_credits < 12:
        # Add more courses
    elif total_credits > 18:
        # Remove or defer courses
```

## Benefits

### With Sample Sequence
- ✅ Aligns with official UIUC curriculum
- ✅ Provides temporal guidance
- ✅ Helps with semester planning
- ✅ Balances workload automatically
- ✅ More accurate for each student year

### With LLM (Optional)
- ✅ Natural language explanations
- ✅ Personalized advice
- ✅ Better user experience
- ✅ Handles complex questions

## Risks & Mitigation

### Risk: Sample Sequence May Not Match All Students
**Mitigation:** Use as guidance, not strict requirement. Allow flexibility.

### Risk: LLM Costs
**Mitigation:** Use only for explanations, cache responses, optional feature.

### Risk: Over-Engineering
**Mitigation:** Start with rule-based, add LLM only if needed.

## Recommendation

**Implement Phase 1 (Enhanced Rule-Based) now:**
- Parse and integrate sample sequence
- Add year detection and semester planning
- Enhance recommender with sequence alignment

**Consider Phase 2 (LLM) later:**
- Only if users request explanations
- Only for non-critical features
- Monitor costs carefully

## Next Steps

1. ✅ Parse sample sequence (structure created)
2. ⏭️ Integrate into major_requirements.json
3. ⏭️ Add year detection logic
4. ⏭️ Enhance recommender with sequence alignment
5. ⏭️ Update frontend with semester view
6. ⏭️ Test with various student profiles

## References

- [UIUC CS Degree Requirements](https://catalog.illinois.edu/undergraduate/engineering/computer-science-bs/#degreerequirementstext)
- [UIUC CS Sample Sequence](https://catalog.illinois.edu/undergraduate/engineering/computer-science-bs/#samplesequencetext)
- [Recommendation Strategy](RECOMMENDATION_STRATEGY.md)
- [Implementation Plan](IMPLEMENTATION_PLAN.md)

