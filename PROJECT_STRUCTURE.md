# Project Structure

## Overview

This repository contains a course recommendation system for UIUC students.

## Directory Structure

```
FA25-Group11/
├── Docs/                          # Project documentation
│   ├── PLAN.md
│   └── RUN.md
├── Project/
│   ├── data_scraping/             # Data scraping pipeline
│   │   ├── scripts/               # Python scraping scripts
│   │   ├── raw_data/              # Raw scraped data
│   │   │   ├── all_courses.csv    # All UIUC courses
│   │   └── majors/                # Scraped major data (JSON)
│   │   ├── output/                # Processed data
│   │   │   ├── processed/         # Intermediate processing results
│   │   │   └── ml_ready/          # ML-ready data files
│   │   ├── deprecated/            # Old/deprecated code
│   │   ├── docs/                  # Scraping documentation
│   │   ├── README.md              # Data scraping overview
│   │   ├── PROGRESS.md            # Current progress
│   │   └── requirements.txt       # Python dependencies
│   ├── Frontend/                  # React frontend application
│   ├── MVP_ROADMAP.md            # Project roadmap
│   └── README.md                 # Project overview
└── README.md                      # Root README
```

## Key Files

### Data Scraping
- **Scripts**: All Python scripts in `Project/data_scraping/scripts/`
- **Raw Data**: `all_courses.csv` and `majors/*.json`
- **ML-Ready Data**: `output/ml_ready/course_graph.json` and `major_requirements.json`

### Documentation
- **Project Docs**: `Docs/PLAN.md`, `Docs/RUN.md`
- **Scraping Docs**: `Project/data_scraping/docs/`
- **Progress**: `Project/data_scraping/PROGRESS.md`

## Next Steps

See `Project/MVP_ROADMAP.md` for development roadmap.
