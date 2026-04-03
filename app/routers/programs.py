from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..dependencies import get_db
from .. import models

router = APIRouter()


@router.get("/programs/")
def list_programs(db: Session = Depends(get_db)):
    return db.query(models.Program).all()


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
    program.json_data = json_data
    db.commit()
    db.refresh(program)
    return {"status": "updated"}
