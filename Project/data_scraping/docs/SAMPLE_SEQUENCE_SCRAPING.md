# Sample Sequence Scraping

## Overview

This document describes the sample sequence scraping process for all UIUC undergraduate majors.

## Implementation

### Script: `scrape_sample_sequences.py`

The script:
1. Loads all major URLs from `major_requirements.json`
2. For each major, scrapes the catalog page
3. Extracts sample sequence from the `samplesequencetextcontainer` div
4. Parses the table structure to extract:
   - Year (first_year, second_year, third_year, fourth_year)
   - Semester (fall, spring)
   - Course codes
   - Credit hours
5. Saves all sequences to `output/ml_ready/sample_sequences.json`

### Table Structure

The sample sequence tables follow this structure:
- **Row 0**: Year header (e.g., "First Year")
- **Row 1**: Semester headers (e.g., "First Semester | Hours | Second Semester | Hours")
- **Row 2+**: Course data with alternating fall/spring columns

### Extraction Logic

1. **Year Detection**: Identifies year headers in first cell
2. **Semester Parsing**: Skips header row, then processes course rows
3. **Course Extraction**: 
   - Extracts course codes from links (`<a>` tags)
   - Falls back to text extraction if no links
   - Gets credit hours from adjacent cell
4. **Credit Calculation**: Sums credits per semester

## Output Format

```json
{
  "Major Name, Degree": {
    "first_year": {
      "fall": {
        "courses": [
          {
            "code": "CS 124",
            "credits": "3",
            "required": true
          }
        ],
        "total_credits": 16.0
      },
      "spring": { ... }
    },
    "second_year": { ... },
    "third_year": { ... },
    "fourth_year": { ... }
  }
}
```

## Status

- **Total Majors**: 316
- **Scraping**: In progress (running in background)
- **Output File**: `data_scraping/output/ml_ready/sample_sequences.json`

## Integration

The sample sequences are integrated into the recommendation system:

1. **Data Loader** (`backend/app/services/data_loader.py`):
   - Loads `sample_sequences.json`
   - Provides fuzzy matching for major names
   - Falls back to CS-specific file if needed

2. **Recommender** (`backend/app/services/recommender.py`):
   - Uses sample sequence to prioritize courses
   - Groups recommendations by semester
   - Aligns with official curriculum

3. **Year Detector** (`backend/app/services/year_detector.py`):
   - Detects student's academic year
   - Used to load appropriate sequence

## Monitoring

Check progress:
```bash
tail -f data_scraping/scripts/sample_sequence_scrape.log
```

Check if process is running:
```bash
ps aux | grep scrape_sample_sequences
```

## Notes

- Rate limiting: 1 second delay between requests
- Some majors may not have sample sequences (will be skipped)
- The scraper handles various table formats and edge cases
- Fuzzy matching helps handle minor name variations

