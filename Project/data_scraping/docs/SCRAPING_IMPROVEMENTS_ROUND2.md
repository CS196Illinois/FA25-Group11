# Major Scraping Improvements - Round 2

## Date: Current Session

## Analysis of 5 Random Majors

After analyzing 5 completely different majors:

1. **Topics_in_English.json** - English concentration with cluster areas
2. **Educational_Equality\_\_Cultural_Understanding.json** - Education major with generic course categories
3. **Computer_Science\_\_Animal_Sciences_BS.json** - Dual major with complex requirements
4. **Media_Cinema_Studies_BS.json** - Media major with core course categories
5. **Scandinavian_Studies.json** - Language major with level-based requirements

## Critical Issues Identified for ML Model

### 1. Co-requisite Sequences Not Captured

- **Issue**: Courses marked with "&" (e.g., "CMN 111 &CMN 112", "CHEM 102 &CHEM 103") indicate sequences that must be taken together, not choices
- **Impact**: ML model needs to know these courses are co-requisites for proper scheduling
- **Fix**: Added detection for "&" notation and mark as `type: 'sequence'` with `sequence` array
- **Location**: `scrape_major.py` lines 141-150

### 2. Missing Metadata in Paragraphs

- **Issue**: Paragraphs contain critical information:
  - Course codes mentioned in text (e.g., "ENGL 301, ENGL 350, and 9 more hours")
  - Level requirements (e.g., "300-level or higher", "400-level courses")
  - Credit hour requirements (e.g., "9 hours", "12-13 hours")
- **Impact**: This metadata is essential for understanding requirement constraints
- **Fix**: Enhanced paragraph extraction to capture:
  - `course_codes`: All course codes mentioned
  - `level_requirement`: Minimum course level required
  - `credit_requirement`: Credit hours needed
- **Location**: `scrape_major.py` lines 77-96

### 3. Missing Course Codes in Lists

- **Issue**: Lists often contain course codes that weren't being extracted
- **Impact**: Missing courses from major requirements
- **Fix**: Extract all course codes from list items and store in `course_codes` field
- **Location**: `scrape_major.py` lines 98-109

### 4. Generic Course Categories

- **Issue**: Many majors reference generic categories like:
  - "Basic Animal Sciences course"
  - "Cluster Course"
  - "History Core Course"
  - "SCAN 200-level course from list"
- **Impact**: These need to be mapped to actual course lists for the ML model
- **Status**: Identified but requires additional parsing logic (future enhancement)

### 5. Sequence vs Choice Confusion

- **Issue**: Previous implementation didn't distinguish between:
  - Sequences (must take together): "CHEM 102 &CHEM 103"
  - Choices (pick one): "MATH 220 or MATH 221"
- **Impact**: Critical for prerequisite graph construction
- **Fix**: Added explicit `type: 'sequence'` for "&" notation, separate from `type: 'choice'` for "or"
- **Location**: `scrape_major.py` lines 141-182

## Parser Enhancements

### 1. Sequence Course Support

- Added handling for `type: 'sequence'` courses in `parse_course_table`
- Normalizes all courses in sequence
- **Location**: `parse_requirements.py` lines 86-95

### 2. Enhanced Group Metadata

- Groups now track:
  - `credits_required`: Credit hours needed for the group
  - `level_requirement`: Minimum course level (e.g., "300", "400")
- Extracted from paragraph metadata
- **Location**: `parse_requirements.py` lines 240-260

## Data Structure Improvements

### New Course Types

1. **`type: 'sequence'`**: Courses that must be taken together

   ```json
   {
     "type": "sequence",
     "code": "CHEM 102",
     "sequence": ["CHEM 102", "CHEM 103"],
     "hours": "4"
   }
   ```

2. **`type: 'choice'`**: Student picks one option
   ```json
   {
     "type": "choice",
     "code": "MATH 220",
     "options": ["MATH 220", "MATH 221"],
     "hours": "4"
   }
   ```

### Enhanced Paragraph Data

```json
{
  "type": "paragraph",
  "content": "Students must complete at least 15 hours of coursework at the 300-level or above...",
  "course_codes": ["ENGL 301", "ENGL 350"],
  "level_requirement": "300",
  "credit_requirement": "15"
}
```

## Impact on ML Model

These improvements enable:

1. **Better Prerequisite Graph**: Sequences and choices are properly represented
2. **Constraint Modeling**: Level and credit requirements can be enforced
3. **Course Discovery**: All course codes mentioned in text are captured
4. **Requirement Validation**: Can verify if student meets credit/level requirements

## Next Steps

1. Re-scrape all majors with improved logic
2. Update alignment script to handle sequences
3. Enhance focus area extraction to map generic categories to course lists
4. Update ML data builder to represent sequences in graph structure
