# CareerPath.AI
AI Career Transition Intelligence Platform that analyzes skills, predicts career opportunities, and builds personalized growth roadmaps
CareerPath AI is an AI-powered career planning and transition platform that helps students, graduates, and professionals make informed career decisions. The platform analyzes user skills, experience, and career goals to provide personalized career recommendations, learning roadmaps, skill assessments, and AI-powered career guidance.
Built using React, Vite, Express.js, SQLite, and Generative AI technologies, CareerPath AI enables users to identify transferable skills, understand career transition feasibility, bridge skill gaps, and track their professional growth through an interactive and intelligent dashboard.

## Features

### Career Recommendations
- AI-generated career suggestions
- Alternative career path recommendations
- Skill overlap analysis
- Missing skill identification
- Career transition insights

### Resume Analysis
- Resume upload support
- Automated skill extraction
- Experience analysis
- Transferable skill detection
- AI-powered profile evaluation

### Personalized Learning Roadmaps
- Step-by-step learning plans
- Skill gap resolution paths
- Milestone tracking
- Progress monitoring
- Adaptive recommendations

### Skill Assessments
- AI-generated quizzes
- Competency evaluation
- Readiness assessment
- Performance feedback

### AI Career Coach
- Interactive chatbot assistant
- Career guidance and mentoring
- Learning recommendations
- Context-aware conversations
- Personalized support

### Dashboard & Analytics
- Career progress visualization
- Learning roadmap tracking
- Assessment performance insights
- Career growth monitoring

### Dark Mode Support
- Dark mode enabled by default
- Persistent theme preferences
- Tailwind CSS-based theme management

### Export Functionality
- PDF report generation
- DOCX exports
- Roadmap downloads
- Progress summaries

## System Architecture

CareerPath AI follows a client-server architecture where the React frontend communicates with an Express backend. User data, skills, assessments, and learning roadmaps are stored in SQLite, while AI-powered functionalities such as resume analysis, career recommendations, roadmap generation, and chatbot responses are handled through Gemini and OpenRouter services.
User
 │
 ▼
React + Vite Frontend
 │
 ▼
Express Backend
 │
 ├── SQLite Database
 │
 └── Gemini / OpenRouter AI Services

##  Tech Stack

### Frontend
- React 19
- TypeScript
- Vite 6
- Tailwind CSS
- Framer Motion
- Lucide React
### Backend
- Node.js
- Express.js
- TypeScript
### Database
- SQLite
- better-sqlite3
### AI Services
- Google Gemini API
- OpenRouter API
### Document Processing
- jsPDF
- docx
- Mammoth
- PDF.js
### Development Tools
- GitHub Actions
- dotenv
- ESLint
- Vite Build System

## Project Structure

CAREERPATH-AI/
│
├── tools/
│
├── node_modules/
│
├── src/
│   │
│   ├── components/
│   │   ├── Assessment.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Chatbot.tsx
│   │   └── Tooltip.tsx
│   │
│   ├── lib/
│   │   └── utils.ts
│   │
│   ├── services/
│   │   └── geminiService.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── .env.example
├── .gitignore
├── career_path.db
├── index.html
├── metadata.json
├── package-lock.json
├── package.json
├── README.md
├── run.bat
├── server.ts
├── tsconfig.json
└── vite.config.ts

##  Module Overview

### Components

The `components` directory contains reusable UI components used throughout the application:
- **Assessment.tsx** – Handles skill assessments and quizzes.
- **Button.tsx** – Reusable button component.
- **Card.tsx** – Dashboard and content card layouts.
- **Chatbot.tsx** – AI Career Coach interface.
- **Tooltip.tsx** – User guidance and contextual tooltips.

### Services

The `services` directory contains application service logic.
**geminiService.ts** handles:
- Gemini API integration
- OpenRouter fallback support
- Career recommendations
- Resume analysis
- Skill extraction
- Chatbot responses

### Backend

The backend is managed through **server.ts**, which handles:
- API endpoints
- User profile management
- Skill storage and retrieval
- Roadmap generation
- AI communication
- Database operations

### Database

The SQLite database (`career_path.db`) stores:
- User profiles
- Skills
- Career recommendations
- Roadmaps
- Assessment results
- Progress tracking data

##  Getting Started

### Clone the Repository

git clone https://github.com/yourusername/careerpath-ai.git
cd careerpath-ai

### Install Dependencies
npm install

### Configure Environment Variables
Create a `.env` file in the project root:
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

##  Running the Application

### Option 1: Using the Launcher Script
run.bat

The launcher script:

- Automatically creates environment scaffolding
- Clears occupied ports
- Prevents EADDRINUSE errors
- Starts frontend and backend services

### Option 2: Manual Startup

npm install
npm run dev

## 🔗 API Endpoints

| Endpoint | Description |
|-----------|-------------|
| `/api/user` | User profile management |
| `/api/skills` | Skill extraction and management |
| `/api/roadmap` | Learning roadmap operations |
| `/api/chat` | AI assistant communication |

##  AI Integration

CareerPath AI uses a dual-provider AI architecture to ensure reliability and uninterrupted service.
### Google Gemini
Used for:
- Resume parsing
- Skill extraction
- Career recommendations
- Roadmap generation
- Assessment generation
### OpenRouter
Acts as a fallback provider when:
- Gemini is unavailable
- API rate limits are reached
- Additional AI availability is required
This architecture ensures continuous chatbot and recommendation functionality.

## Theme Support

The platform includes a fully responsive dark-mode implementation.
Features include:
- Dark mode enabled by default
- Persistent user preferences
- Tailwind CSS dark mode support
- Seamless theme switching

## Current Status

The project is currently:
 Fully Functional
 AI Integrated
 Database Connected
 Export Features Working
 Dark Mode Enabled
 Lint-Clean
 Production Ready

### Recent Improvements

- Added OpenRouter fallback support
- Improved AI reliability
- Automated environment setup
- Port cleanup during startup
- Fixed Windows path compatibility issues
- Eliminated EADDRINUSE startup errors
- Enhanced dark mode persistence

##  Future Enhancements

- LinkedIn Profile Integration
- GitHub Repository Analysis
- Real-Time Job Market Analytics
- Interview Preparation Module
- Career Feasibility Scoring Engine
- Mentor Recommendation System
- Mobile Application Support
- Multi-Language Support
- Advanced Career Growth Predictions

##  Author

### Gana C Shekhar
**Bachelor of Engineering – Computer Science & Engineering**  
Dayananda Sagar Academy of Technology and Management (DSATM)

## License
This project is developed for educational, research, and career development purposes.

## Support
If you found this project useful, consider giving it a STAR on GitHub and sharing it with others.
**CareerPath AI – Empowering Smarter Career Decisions Through Artificial Intelligence.**
