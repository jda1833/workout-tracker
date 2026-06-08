from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_db
from .. import models

router = APIRouter()


@router.get("/export/")
def export_all(db: Session = Depends(get_db)):
    programs = (
        db.query(models.Program)
        .filter(models.Program.deleted == False)
        .order_by(models.Program.week.asc())
        .all()
    )
    checkins = db.query(models.CheckIn).order_by(models.CheckIn.week.asc()).all()
    return {
        "programs": [p.json_data for p in programs],
        "check_ins": [c.json_data for c in checkins],
    }
