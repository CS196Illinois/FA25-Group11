# UIUC Course Recommendation System

A full-stack course recommendation system for UIUC students, helping them plan their academic journey based on completed courses and major requirements.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd Project/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API will be available at `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

### Frontend Setup
```bash
cd Project/Frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 📁 Project Structure

```
Project/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── models/            # Pydantic models
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Validation utilities
│   │   └── main.py            # FastAPI app
│   └── requirements.txt
├── Frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API service layer
│   │   ├── utils/             # Validation utilities
│   │   └── App.jsx
│   └── package.json
└── data_scraping/              # Data pipeline
    ├── output/ml_ready/        # ML-ready data files
    └── scripts/                # Scraping scripts
```

## ✨ Features

- **Course Recommendations**: Get personalized course recommendations based on completed courses
- **Prerequisite Checking**: Automatically validates prerequisites with OR logic
- **Degree Progress**: Track progress toward degree completion
- **Course Details**: View detailed information about any course
- **Input Validation**: Validates and normalizes course codes
- **Error Handling**: User-friendly error messages

## 📊 Current Status

- ✅ Data scraping complete (317 majors, 7,968 courses)
- ✅ Backend API implemented (FastAPI)
- ✅ Frontend components built (React)
- ✅ CS major support
- ✅ Input validation & error handling
- ✅ Testing complete

## 🎯 How It Works

1. **Select Completed Courses**: Users select courses they've already completed
2. **Get Recommendations**: System analyzes prerequisites and major requirements
3. **View Progress**: See degree completion percentage
4. **Explore Courses**: Click any course for detailed information

## 🔧 API Endpoints

- `GET /api/majors` - Get list of all majors
- `GET /api/majors/{major_name}/courses` - Get courses for a major
- `POST /api/recommend` - Get course recommendations
- `GET /api/courses/{course_code}` - Get course details
- `GET /api/courses/{course_code}/prerequisites` - Get prerequisite chain

## 📝 Documentation

All documentation is organized in the `docs/` folder:

- [Architecture](docs/ARCHITECTURE.md) - System architecture and design
- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Testing Guide](docs/TESTING.md) - How to test the system
- [Full Stack Status](docs/FULL_STACK_STATUS.md) - Current implementation status
- [Improvements](docs/IMPROVEMENTS.md) - Recent improvements made
- [Additional Improvements](docs/ADDITIONAL_IMPROVEMENTS.md) - Validation & error handling

## 🛠️ Technology Stack

**Backend:**
- FastAPI (Python web framework)
- Pydantic (Data validation)
- NetworkX (Graph operations)

**Frontend:**
- React (UI framework)
- Vite (Build tool)
- Axios (HTTP client)

**Data:**
- JSON files (Course data)
- Graph structures (Prerequisites)

## 🚧 Next Steps

- Add more majors beyond Computer Science
- Improve recommendation algorithm
- Add semester planning
- User accounts (optional)
- Focus area recommendations

## 📄 License

This project is part of FA25-Group11 coursework.
