from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parents[1]
INDEX_FILE = BASE_DIR / "data" / "index.html"


@router.get("/", response_class=HTMLResponse)
def read_root():
    if not INDEX_FILE.exists():
        raise HTTPException(status_code=500, detail="Frontend file not found")
    return INDEX_FILE.read_text(encoding="utf-8")
