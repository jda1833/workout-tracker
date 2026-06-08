from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..dependencies import get_db
from .. import models

router = APIRouter()


@router.get("/check-ins/")
def list_checkins(db: Session = Depends(get_db)):
    return db.query(models.CheckIn).order_by(models.CheckIn.week.asc()).all()


@router.get("/check-ins/{week}")
def get_checkin(week: int, db: Session = Depends(get_db)):
    checkin = db.query(models.CheckIn).filter(models.CheckIn.week == week).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    return checkin


@router.post("/check-ins/")
def save_checkin(json_data: dict, db: Session = Depends(get_db)):
    raw_week = json_data.get("week_number")
    if raw_week is None:
        raise HTTPException(status_code=400, detail="'week_number' is required")
    try:
        week = int(raw_week)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="'week_number' must be an integer")

    existing = db.query(models.CheckIn).filter(models.CheckIn.week == week).first()
    if existing:
        existing.json_data = json_data
        db.commit()
        db.refresh(existing)
        return {"status": "updated", "id": existing.id}

    checkin = models.CheckIn(week=week, json_data=json_data)
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return {"status": "created", "id": checkin.id}


@router.delete("/check-ins/{week}")
def delete_checkin(week: int, db: Session = Depends(get_db)):
    checkin = db.query(models.CheckIn).filter(models.CheckIn.week == week).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    db.delete(checkin)
    db.commit()
    return {"status": "deleted"}
