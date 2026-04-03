from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..dependencies import get_db
from .. import models
from ..services.validation import validate_program_payload

router = APIRouter()


@router.get("/programs/")
def list_programs(db: Session = Depends(get_db)):
    return db.query(models.Program).order_by(models.Program.week.asc()).all()


@router.get("/programs/{week}")
def get_program(week: int, db: Session = Depends(get_db)):
    program = db.query(models.Program).filter(models.Program.week == week).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program.json_data


@router.post("/update-program/{program_id}")
def update_program(program_id: int, json_data: dict, db: Session = Depends(get_db)):
    program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    validation_errors = validate_program_payload(json_data)
    if validation_errors:
        raise HTTPException(status_code=400, detail=validation_errors)

    next_week = json_data["week"]
    existing_program = (
        db.query(models.Program)
        .filter(models.Program.week == next_week, models.Program.id != program_id)
        .first()
    )
    if existing_program:
        raise HTTPException(status_code=400, detail=f"Week {next_week} already exists.")

    program.week = next_week
    program.json_data = json_data
    db.commit()
    db.refresh(program)
    return {"status": "updated"}


@router.delete("/programs/{program_id}")
def delete_program(program_id: int, db: Session = Depends(get_db)):
    program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    db.delete(program)
    db.commit()
    return {"status": "deleted"}
