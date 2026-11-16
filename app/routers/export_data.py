import io
import json
import zipfile
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..dependencies import get_db
from .. import models

router = APIRouter()


def _load_all(db: Session):
    programs = (
        db.query(models.Program)
        .filter(models.Program.deleted == False)
        .order_by(models.Program.week.asc())
        .all()
    )
    checkins = db.query(models.CheckIn).order_by(models.CheckIn.week.asc()).all()
    notes = db.query(models.ExerciseNote).order_by(models.ExerciseNote.exercise_name.asc()).all()
    return programs, checkins, notes


def _program_stats(data: dict) -> dict:
    days = data.get("days") or []
    exercises = [ex for day in days for ex in (day.get("exercises") or [])]
    sets = [s for ex in exercises for s in (ex.get("sets") or [])]
    logged = [s for s in sets if s.get("reps") not in (None, "")]
    return {
        "days": len(days),
        "exercises": len(exercises),
        "sets": len(sets),
        "logged_sets": len(logged),
    }


@router.get("/export/")
def export_all(db: Session = Depends(get_db)):
    programs, checkins, _ = _load_all(db)
    return {
        "programs": [p.json_data for p in programs],
        "check_ins": [c.json_data for c in checkins],
    }


@router.get("/export/archive/")
def export_archive(db: Session = Depends(get_db)):
    programs, checkins, notes = _load_all(db)
    now = datetime.now(timezone.utc)

    program_entries = []
    for p in programs:
        path = f"programs/week_{p.week:03d}.json"
        program_entries.append({"week": p.week, "file": path, **_program_stats(p.json_data or {})})

    checkin_entries = [
        {"week": c.week, "file": f"check_ins/week_{c.week:03d}.json"} for c in checkins
    ]

    summary = {
        "exported_at": now.isoformat(),
        "totals": {
            "programs": len(programs),
            "check_ins": len(checkins),
            "exercise_notes": len(notes),
            "sets": sum(e["sets"] for e in program_entries),
            "logged_sets": sum(e["logged_sets"] for e in program_entries),
        },
        "program_weeks": [p.week for p in programs],
        "check_in_weeks": [c.week for c in checkins],
        "programs": program_entries,
        "check_ins": checkin_entries,
    }

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for p, entry in zip(programs, program_entries):
            zf.writestr(entry["file"], json.dumps(p.json_data, indent=2))
        for c, entry in zip(checkins, checkin_entries):
            zf.writestr(entry["file"], json.dumps(c.json_data, indent=2))
        zf.writestr(
            "exercise_notes.json",
            json.dumps({n.exercise_name: n.note for n in notes}, indent=2),
        )
        zf.writestr("summary.json", json.dumps(summary, indent=2))

    filename = f"workout-export-{now.strftime('%Y%m%d-%H%M%S')}.zip"
    return Response(
        content=buf.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/reset/")
def reset_all(confirm: str = "", db: Session = Depends(get_db)):
    """Permanently delete all programs (including trashed), check-ins and exercise notes."""
    if confirm != "DELETE":
        raise HTTPException(status_code=400, detail="Pass confirm=DELETE to wipe all data")

    removed = {
        "programs": db.query(models.Program).delete(),
        "check_ins": db.query(models.CheckIn).delete(),
        "exercise_notes": db.query(models.ExerciseNote).delete(),
    }
    db.commit()
    return {"status": "reset", "removed": removed}
