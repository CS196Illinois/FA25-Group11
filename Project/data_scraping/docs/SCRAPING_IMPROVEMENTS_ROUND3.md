# Major Scraping Improvements - Round 3

## Date: Current Session

## Analysis of 5 More Random Majors

After analyzing 5 completely different majors:

1. **Policy_International_Trade_Development.json** - Agricultural Economics concentration with credit hour variations
2. **Arts\_\_Entertainment_Technology.json** - Theatre concentration with generic course categories
3. **Food_Animal_Production_Management.json** - Animal Sciences with multiple sequences and choices
4. **German_Business_Commercial_Studies.json** - Language major with level-based requirements
5. **Elementary_Education_BS.json** - Education major with title-only course codes

## Critical Issues Identified

### 1. Title-Only Course Codes Not Extracted

- **Issue**: Some courses have codes in the title field but no `code` field because the code isn't a clickable link (e.g., "KIN 268" in Elementary Education)
- **Impact**: Missing course codes from major requirements
- **Fix**: Enhanced code extraction to parse course codes from title text when no link is present
- **Location**: `scrape_major.py` lines 155-163

### 2. Credit Hour Ranges Not Parsed

- **Issue**: Credit hours can be:
  - Ranges: "3-4", "1 to 5"
  - Choices: "3 or 6", "1 or 2" (variable credit hours, not course choices)
  - Single values: "3", "4"
- **Impact**: ML model needs to know credit hour constraints for scheduling
- **Fix**: Parse credit hours into `hours_min` and `hours_max` fields
- **Location**: `scrape_major.py` lines 210-228

### 3. Generic Course Categories Still Prevalent

- **Issue**: Many majors reference generic categories:
  - "Calculus Option"
  - "Statistics Option"
  - "AET 'choose 6 credits from' course"
  - "GER course from list"
  - "Applied Science course"
- **Impact**: These need to be mapped to actual course lists
- **Status**: Identified - requires additional parsing logic (future enhancement)

### 4. Credit Hour "or" vs Course "or" Confusion

- **Issue**: "3 or 6" in hours field means variable credit hours, not course choices
- **Impact**: Need to distinguish between:
  - Course choice: "MATH 220 or MATH 221" (pick one course)
  - Credit variation: "3 or 6" (course has variable credits)
- **Status**: Now properly handled - credit hours parsed separately

## Improvements Implemented

### 1. Enhanced Code Extraction

- Now extracts course codes from title text when no link is present
- Uses regex pattern: `^([A-Z]{2,4})\s+(\d{3}[A-Z]?)`
- **Example**: "KIN 268" in title field → extracted as code: "KIN 268"

### 2. Credit Hour Parsing

- Parses credit hours into structured format:
  ```json
  {
    "hours": "3-4",
    "hours_min": 3,
    "hours_max": 4
  }
  ```
- Handles formats:
  - Ranges: "3-4", "1 to 5"
  - Choices: "3 or 6" (variable credits)
  - Single: "3"

## Data Structure Enhancements

### New Fields in Course Data

```json
{
  "code": "KIN 268",
  "title": "",
  "hours": "3",
  "hours_min": 3,
  "hours_max": 3
}
```

For variable credit courses:

```json
{
  "code": "ACE 341",
  "hours": "1 or 2",
  "hours_min": 1,
  "hours_max": 2
}
```

## Impact on ML Model

These improvements enable:

1. **Complete Course Coverage**: All course codes are now extracted, even when not linked
2. **Credit Hour Constraints**: Can model variable credit courses and credit hour requirements
3. **Better Scheduling**: ML model can account for credit hour variations when planning schedules

## Remaining Challenges

1. **Generic Course Categories**: Still need to map categories like "Calculus Option" to actual course lists
2. **Sample Sequence Parsing**: Generic categories in sample sequences need better extraction
3. **Focus Area Mapping**: Need to link generic categories to their actual course lists

## Next Steps

1. Re-scrape all majors with improved code extraction
2. Enhance focus area extraction to map generic categories
3. Update parser to handle credit hour constraints
4. Build mapping system for generic course categories
