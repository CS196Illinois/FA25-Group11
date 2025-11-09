# Data Scraping and Processing Pipeline

This directory contains scripts for scraping, processing, and preparing UIUC course and major data for the ML recommendation system.

## Directory Structure

```
data_scraping/
├── scripts/              # Python scripts for scraping and processing
├── raw_data/            # Raw scraped data (CSV, JSON)
│   ├── all_courses.csv  # All UIUC courses with prerequisites
│   └── majors/          # Raw scraped major JSON files
├── deprecated/          # Deprecated code (kept for reference)
└── requirements.txt    # Python dependencies
```

## Workflow

The data pipeline follows these steps:

### 1. Scrape All Courses
```bash
cd scripts
python scrape_all_courses.py
```
- Scrapes all courses from UIUC catalog
- Output: `raw_data/all_courses.csv`

### 2. Scrape All Majors
```bash
cd scripts
python scrape_all_majors.py
```
- Discovers and scrapes all undergraduate majors
- Output: `raw_data/majors/*.json`

### 3. Parse Prerequisites
```bash
cd scripts
python parse_prerequisites.py
```
- Parses prerequisites from course descriptions
- Builds prerequisite/postrequisite graphs
- Output: `output/processed/courses_with_prereqs.json`
- Output: `output/processed/prerequisite_graph.json`
- Output: `output/processed/postrequisite_graph.json`

### 4. Parse Major Requirements
```bash
cd scripts
python parse_requirements.py
```
- Processes all major requirement files
- Extracts course codes and requirement groups
- Output: `output/processed/majors_structured.json`

### 5. Align Majors with Courses
```bash
cd scripts
python align_majors_courses.py
```
- Validates major courses exist in course catalog
- Links prerequisite chains for each major
- Output: `output/processed/major_course_alignments.json`

### 6. Build ML-Ready Data
```bash
cd scripts
python build_ml_data.py
```
- Combines all data into ML-ready format
- Creates NetworkX graph structure
- Output: `output/ml_ready/course_graph.json`
- Output: `output/ml_ready/major_requirements.json`

## Dependencies

Install dependencies:
```bash
pip install -r requirements.txt
```

Required packages:
- beautifulsoup4
- requests
- networkx
- plotly
- scipy

## Notes

- The scraping scripts include delays to be respectful to UIUC servers
- Progress is saved to allow resuming interrupted scrapes
- All course codes are normalized to "DEPT 123" format
- Missing courses are reported in alignment step

