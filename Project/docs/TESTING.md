# Testing Guide

## Quick Test

### Backend
```bash
cd Project/backend
python3 -c "from app.services.recommender import get_recommender; r = get_recommender(); result = r.recommend_courses('Computer Science, BS', ['CS 124', 'MATH 221'], 5); print(f'Progress: {result[\"progress\"][\"percentage\"]:.1f}%'); print(f'Recommendations: {len(result[\"recommendations\"])}')"
```

### Frontend
1. Start backend: `cd Project/backend && uvicorn app.main:app --reload --port 8000`
2. Start frontend: `cd Project/Frontend && npm run dev`
3. Open http://localhost:5173
4. Select courses and get recommendations

## Validation Tests

### Course Code Validation
```python
from app.utils.validation import validate_course_code, normalize_course_code

# Test cases
assert validate_course_code('CS 124') == True
assert validate_course_code('cs 124') == False  # Needs normalization first
assert normalize_course_code('cs 124') == 'CS 124'
assert normalize_course_code('CS124') == 'CS 124'
```

### API Request Validation
```python
from app.api.routes import RecommendationRequest
from pydantic import ValidationError

# Valid request
req = RecommendationRequest(
    major_name='Computer Science, BS',
    completed_courses=['CS 124', 'MATH 221'],
    num_recommendations=5
)

# Invalid - should raise ValidationError
try:
    req = RecommendationRequest(
        major_name='Computer Science, BS',
        completed_courses=['invalid'],
        num_recommendations=5
    )
except ValidationError:
    print("Correctly rejected invalid course codes")
```

## Integration Tests

### Test Full Flow
1. Load major courses
2. Select completed courses
3. Get recommendations
4. View course details
5. Check progress

### Expected Results
- Freshman (CS 124, MATH 221) → Should recommend CS 128, CS 173, ENG 100
- Sophomore (CS 124, 128, 173, 225, MATH 221, 231) → Should recommend MATH 241, PHYS 211, CS 233

## Error Cases

### Test Error Handling
1. Invalid course codes → Should show error message
2. Backend not running → Should show connection error
3. Invalid major → Should show 404 error
4. Empty course selection → Should prevent submission

