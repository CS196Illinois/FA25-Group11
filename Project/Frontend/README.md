# Illinois Course Recommender - Frontend

A modern, animated frontend for the University of Illinois course recommendation system, built with React, Vite, and Framer Motion.

## Features

- 🎨 **UIUC Branding**: Official Illinois colors and design patterns
- ✨ **Smooth Animations**: Page transitions and interactive elements powered by Framer Motion
- 📱 **Responsive Design**: Works beautifully on all devices
- 🚀 **Modern UX**: SaaS-style landing page with engaging user flow
- 🎯 **Multi-Step Onboarding**: Intuitive step-by-step user onboarding
- 📊 **Recommendations Display**: Beautiful card-based layout for course recommendations

## Tech Stack

- **React 19** - Latest React with modern features
- **Vite** - Fast build tool and dev server
- **Framer Motion** - Smooth animations and page transitions
- **React Router** - Client-side routing
- **CSS3** - Custom styling with CSS variables

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── pages/
│   ├── LandingPage.jsx       # Main landing page with hero section
│   ├── LandingPage.css
│   ├── OnboardingPage.jsx   # Multi-step onboarding flow
│   ├── OnboardingPage.css
│   ├── RecommendationsPage.jsx  # Course recommendations display
│   └── RecommendationsPage.css
├── App.jsx                   # Main app with routing
├── App.css
├── main.jsx                  # Entry point
└── index.css                 # Global styles and UIUC theme
```

## Design System

### Colors

- **Illinois Orange**: `#FF6B35` - Primary accent color
- **Illinois Blue**: `#13294B` - Primary brand color
- **Light Blue**: `#1E3A5F` - Secondary brand color

### Typography

- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800

### Animations

All animations use Framer Motion with:
- Smooth page transitions
- Staggered children animations
- Hover and tap interactions
- Scroll-triggered animations

## Pages

### Landing Page (`/`)

- Hero section with animated background
- Feature showcase
- Call-to-action sections
- Smooth scroll navigation

### Onboarding Page (`/onboarding`)

- Multi-step form with progress indicator
- Major selection
- Course input with tags
- Review and confirmation

### Recommendations Page (`/recommendations`)

- Filterable course cards
- Priority badges
- Prerequisite display
- Empty states

## Next Steps

- [ ] Connect to backend API
- [ ] Add course search functionality
- [ ] Implement user authentication
- [ ] Add course detail modals
- [ ] Integrate with DARS system
- [ ] Add semester planning view

## Notes

- Currently uses mock data for recommendations
- Backend integration pending
- All animations are optimized for performance
- Fully responsive and accessible

## License

Built for University of Illinois students.
