# Workout Program Tracker

A small FastAPI app for uploading, viewing, and editing weekly workout programs stored as JSON in SQLite.

## Tech Stack
- FastAPI
- SQLAlchemy
- SQLite
- Uvicorn

## Project Layout
- `app/main.py`: app bootstrap (router registration and static assets mount)
- `app/database.py`: SQLite engine/session setup
- `app/models.py`: database model(s)
- `app/dependencies.py`: shared FastAPI dependencies
- `app/routers/`: split API/page routes (`pages.py`, `programs.py`, `uploads.py`)
- `app/services/validation.py`: JSON program schema validation
- `app/data/index.html`: frontend shell HTML
- `app/assets/css/app.css`: frontend styles
- `app/assets/js/`: split frontend logic (`state.js`, `nav.js`, `tracker.js`, `checkin.js`, `analytics.js`, `upload.js`, `template.js`, `app.js`)
- `app/data/programs.db`: SQLite database file (created automatically)

## Run Locally
1. Create and activate a virtual environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```
4. Open `http://127.0.0.1:8000`

## Run with Docker
Build:
```bash
docker build -t workout-tracker -f Dockerfile .
```

Run:
```bash
docker run --rm -p 8000:8000 workout-tracker
```

Then open `http://127.0.0.1:8000`.

To match that same behavior with local Compose:
```bash
docker compose -f docker-compose.local.yml up --build
```

The local Compose file uses the standard `Dockerfile` name so it can be imported more easily into tools like Dockge/Dockage-style stack managers.

Both Compose files now use persistent SQLite storage via a named Docker volume, so saved programs remain available across container restarts.

## API Endpoints
- `GET /` returns the frontend page
- `POST /upload-json/` uploads a JSON file containing a workout program
- `POST /upload-json-body/` uploads a JSON object from request body
- `GET /programs/` lists all stored programs
- `GET /programs/{week}` fetches a program JSON payload by week
- `POST /update-program/{program_id}` updates a program's JSON payload
- `DELETE /programs/{program_id}` deletes a stored program by id

## Expected Upload Shape
```json
{
  "week": 1,
  "week_type": "5's Week",
  "training_maxes": {
    "squat": 475,
    "bench": 325,
    "deadlift": 525,
    "overhead_press": 225
  },
  "amrap_rule": "Stop at RPE 9 max, optional AMRAP on last main lift set",
  "days": [
    {
      "day": "Monday",
      "focus": "Squat",
      "exercises": [
        {
          "name": "Back Squat (5/3/1)",
          "sets": [
            {"percent": 65, "target_reps": 5, "prescribed_weight": 310, "actual_weight": "", "reps": "", "RPE": ""}
          ]
        }
      ]
    }
  ],
  "weekly_notes": {
    "bodyweight": "",
    "sleep_avg_hours": "",
    "hardest_lift": "",
    "pain_tightness_notes": "",
    "recovery_notes": "",
    "general_notes": ""
  }
}
```

The app now validates this structure on both file upload and pasted JSON upload.
