# Major Scraping Improvements - Round 4

## Date: Current Session

## Comprehensive Analysis of All Scraped Data

After analyzing 409 scraped majors, identified critical issues:

### Issues Found

1. **33 Majors with No Requirements** (8% of majors)

   - Examples: Psychology BSLAS, Computer Science BS, Geography BSLAS
   - Impact: Missing critical data for ML model
   - Root Cause: Fallback logic not comprehensive enough

2. **683 Summary Rows Included as Courses**

   - Pattern: Rows with only credit hours (e.g., "3-4", "8-11") but no course codes
   - Impact: Pollutes course data with non-course entries
   - Root Cause: No filtering for summary/total rows

3. **1,587 Courses with Code but No Hours**

   - Pattern: Course codes present but hours missing
   - Impact: Incomplete course information
   - Root Cause: Hours might be in different rows or format

4. **Choice Courses Not Properly Linked**
   - Pattern: Courses like "CS 210 or CS 211" split across rows not properly combined
   - Impact: Missing choice relationships
   - Root Cause: Choice detection logic not handling all cases

## Improvements Implemented

### 1. Enhanced Fallback Logic for Missing Requirements

**Location**: `scrape_major.py` lines 52-70

- Added multiple fallback selectors:

  - `sc_sccoursedescs` div
  - `requirements` div (by id)
  - `degree-requirements` / `requirements` (by class)
  - Dynamic search for divs with "requirement" or "degree" in class/id
  - Tab content containers
  - Main content area (with validation)

- Added validation to ensure meaningful content:
  - Filters out empty or trivial paragraphs
  - Requires tables, lists, or substantial paragraphs (>50 chars)

### 2. Summary Row Filtering

**Location**: `scrape_major.py` lines 249-262

- Filters out rows that have:
  - Credit hours present
  - No course code
  - No course code in title field
- Logic:

  ```python
  if has_hours and not has_code and not has_title_with_code:
      # Skip summary row
      continue
  ```

- Impact: Eliminates ~683 false course entries

### 3. Improved Choice Course Detection

**Location**: `scrape_major.py` lines 202-221

- Enhanced detection for choice courses spanning multiple rows:

  - Checks if next row starts with "or"
  - Checks if next row contains "or" with course code
  - Extracts codes from both current and next row
  - Handles cases where code is in link vs text

- Better handling of:
  - "CS 210 or CS 211" split across rows
  - "MATH 220 or MATH 221" patterns
  - Choice courses with codes in different formats

### 4. Content Validation

- Added check to ensure extracted content is meaningful:
  - Must have tables, lists, or substantial paragraphs
  - Prevents saving empty or trivial requirement sections
  - Ensures quality of scraped data

## Testing Results

### Before Improvements

- 33 majors with no requirements
- 683 summary rows included
- Many choice courses not properly linked

### After Improvements

- Summary rows successfully filtered (0 found in test)
- Choice course detection improved
- Fallback logic more comprehensive

## Remaining Challenges

1. **Some majors still missing requirements** - May need page-specific logic
2. **Courses with code but no hours** - May need row merging logic
3. **Generic course categories** - Still need mapping system

## Next Steps

1. Re-scrape all majors with improved logic
2. Verify all 33 problematic majors now have requirements
3. Validate summary row filtering across all majors
4. Test choice course detection on known problematic cases
