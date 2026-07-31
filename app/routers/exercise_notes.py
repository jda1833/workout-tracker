from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..dependencies import get_db
from .. import models

router = APIRouter()


class NoteBody(BaseModel):
    note: str = Field(max_length=100)


@router.get("/exercise-notes/")
def list_notes(db: Session = Depends(get_db)):
    rows = db.query(models.ExerciseNote).all()
    return {row.exercise_name: row.note for row in rows}


@router.post("/exercise-notes/{exercise_name}")
def save_note(exercise_name: str, body: NoteBody, db: Session = Depends(get_db)):
    existing = db.query(models.ExerciseNote).filter(
        models.ExerciseNote.exercise_name == exercise_name
    ).first()
    if existing:
        existing.note = body.note
    else:
        existing = models.ExerciseNote(exercise_name=exercise_name, note=body.note)
        db.add(existing)
    db.commit()
    return {"status": "ok"}
