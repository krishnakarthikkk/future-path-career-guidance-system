# AI Career Recommendation & Student Profile Analyzer

A full-stack, intelligent career recommendation platform built for final-year CSE minor project evaluations. The system analyzes a student's complete academic, technical, soft skills, and extracurricular profile to recommend suitable career paths and trace skill gaps.

---

## Technical Stack

- **Frontend**: React.js (Vite), Tailwind CSS (Purple & White theme, custom glassmorphism components)
- **Backend**: Python Flask (REST API)
- **Database**: MongoDB Atlas (with automatic local file-based JSON database fallback)
- **Authentication**: JWT-based session security and password hashing via `bcrypt`
- **Reporting**: Dynamic PDF report synthesis via `reportlab`

---

## Directory Structure

```text
ai-career-analyzer/
├── README.md                  # Project documentation
├── run.bat                    # One-click startup script for Windows
├── backend/
│   ├── app.py                 # REST API endpoints controller
│   ├── auth.py                # JWT & Password helper
│   ├── database.py            # MongoDB and local database fallback module
│   ├── engine.py              # Rule-based Career Recommendation Engine
│   ├── pdf_generator.py       # ReportLab PDF generator
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Configuration file (MONGO_URI)
│   └── data/                  # Pre-populated catalogs
│       ├── careers.json       # Career master catalog
│       └── courses.json       # Courses master catalog
└── frontend/                  # React application directory
```

---

## Resilient Database Architecture

During examiner evaluations, internet access or MongoDB Atlas credentials might not be available. To solve this, the application implements a **Dual-Mode Database Adapter** in `backend/database.py`:
1. **Cloud Mode**: Connects to MongoDB Atlas if `MONGO_URI` is supplied in `backend/.env`.
2. **Local Mode (Fallback)**: If no URI is configured or if the cloud connection times out (3-second timeout), the backend automatically falls back to storing data as local, indented JSON files under `backend/database/`. 

All queries and updates utilize a simulated MongoDB client wrapper (`LocalCollection`), allowing the entire application to remain 105% functional offline out of the box.

---

## Recommendation Engine Logic

The engine evaluates student profiles against 14 target pathways using a weight-based scoring system:
1. **Academics (15%)**: Evaluates CGPA thresholds.
2. **Technical Skills (35%)**: Calculates direct overlap of skills and programming languages, with bonus points for projects, internships, hackathons, and certifications.
3. **Soft Skills (20%)**: Evaluates preferred soft skills for each track (e.g. Problem Solving for Software Engineering, Leadership for Management/Defence).
4. **Extracurricular Activities (15%)**: Evaluates NSS, NCC, Sports, and event coordination flags.
5. **Career Interests (15%)**: Evaluates alignment with student interests.

---

## Quick Start Instructions

### Prerequisites
- Python 3.10+
- Node.js v18+

### Launching the Application
1. Double-click the `run.bat` file in the root directory.
2. The script will:
   - Check and create the Python virtual environment.
   - Install backend and frontend dependencies automatically.
   - Launch the Flask server on `http://localhost:5000`.
   - Launch the React server on `http://localhost:5173`.
   - Open `http://localhost:5173` in your default browser.

### Configuring MongoDB Atlas (Optional)
If you wish to run in cloud database mode:
1. Edit `backend/.env`.
2. Set the `MONGO_URI` variable to your MongoDB Atlas connection string.
3. Save the file and restart the backend. The server will automatically seed the cloud collections.
