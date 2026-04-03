import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import models
from ..dependencies import get_db
from ..services.validation import validate_program_payload

router = APIRouter()


@router.post("/upload-json/")
async def upload_json(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    validation_errors = validate_program_payload(data)
    if validation_errors:
        raise HTTPException(status_code=400, detail=validation_errors)

    program = models.Program(week=data["week"], json_data=data)
    db.add(program)
    db.commit()
    db.refresh(program)
    return {"status": "success", "id": program.id}


@router.post("/upload-json-body/")
def upload_json_body(json_data: dict, db: Session = Depends(get_db)):
    validation_errors = validate_program_payload(json_data)
    if validation_errors:
        raise HTTPException(status_code=400, detail=validation_errors)

    program = models.Program(week=json_data["week"], json_data=json_data)
    db.add(program)
    db.commit()
    db.refresh(program)
    return {"status": "success", "id": program.id}
