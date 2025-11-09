# Major Scraping Improvements

## Date: Current Session

## Issues Identified from 10 Random Majors

After reviewing 10 diverse majors (Sculpture, Physics, Communication, Bioengineering, Linguistics, Sustainability, Slavic Studies, Health Diversity, Information Sciences, Health Behavior Change), the following issues were identified:

### 1. Missing Degree Requirements
- **Issue**: Some majors (e.g., Slavic Studies) had no `degree_requirements` section
- **Fix**: Added fallback logic to search for alternative container selectors when primary container is not found
- **Location**: `scrape_major.py` lines 52-59

### 2. Choice Courses Not Properly Extracted
- **Issue**: Courses with "or" options (e.g., "IS 307 or IS 308 OR IS 309") were not being parsed as choice courses
- **Fix**: Enhanced `extract_course_table` to:
  - Detect "or" in title field
  - Check next row for continuation of choice options
  - Extract all course codes and mark as `type: 'choice'` with `options` array
- **Location**: `scrape_major.py` lines 106-185

### 3. Filename Normalization Issues
- **Issue**: Some filenames had double underscores or missing separators (e.g., "Slavic_StudiesBALAS.json")
- **Fix**: Improved filename sanitization to:
  - Handle special characters (&, +, commas, periods)
  - Remove double underscores
  - Better preserve structure
- **Location**: `scrape_all_majors.py` lines 153-160

### 4. Choice Course Parsing in Requirements
- **Issue**: The parsing script didn't handle the new `type: 'choice'` format from improved scraper
- **Fix**: Updated `parse_course_table` to:
  - Recognize `type: 'choice'` courses
  - Extract and normalize all options
  - Handle both new format and legacy format
- **Location**: `parse_requirements.py` lines 86-111

### 5. Course Code Extraction from Choice Courses
- **Issue**: `extract_all_course_codes_from_content` didn't extract codes from choice course options
- **Fix**: Added logic to iterate through `options` array when encountering choice courses
- **Location**: `parse_requirements.py` lines 191-196

## Improvements Summary

### Scraper Enhancements (`scrape_major.py`)
1. **Alternative Container Detection**: Fallback to search for requirements in alternative locations
2. **Choice Course Detection**: Multi-row detection for "or" courses spanning multiple table rows
3. **Better Course Code Extraction**: Regex-based extraction of all course codes from choice text

### Parser Enhancements (`parse_requirements.py`)
1. **Choice Course Support**: Full support for `type: 'choice'` courses with `options` array
2. **Normalized Options**: All choice options are normalized to standard format (e.g., "IS 307")
3. **Backward Compatibility**: Still handles legacy format where codes are in title text

### Filename Improvements (`scrape_all_majors.py`)
1. **Better Sanitization**: Handles more special characters
2. **Double Underscore Removal**: Cleans up formatting issues
3. **Consistent Naming**: More predictable filename generation

## Testing

The improvements have been tested on:
- Information Sciences BS (choice courses)
- Sustainability in Food & Environmental Systems BS (complex tables)
- Communication BALAS (large course lists)

## Next Steps

1. Monitor scraping progress for any new edge cases
2. Re-parse all majors with improved parser to extract choice courses
3. Update alignment script to handle choice courses in prerequisite matching
4. Update ML data builder to represent choice courses in graph structure

