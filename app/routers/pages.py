from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, HTMLResponse

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parents[1]
INDEX_FILE = BASE_DIR / "data" / "index.html"
FAVICON_FILE = BASE_DIR / "assets" / "icons" / "weight-plate.svg"


@router.get("/", response_class=HTMLResponse)
def read_root():
    if not INDEX_FILE.exists():
        raise HTTPException(status_code=500, detail="Frontend file not found")
    return INDEX_FILE.read_text(encoding="utf-8")


@router.get("/favicon.ico", include_in_schema=False)
def read_favicon():
    if not FAVICON_FILE.exists():
        raise HTTPException(status_code=404, detail="Favicon not found")
    return FileResponse(FAVICON_FILE, media_type="image/svg+xml")
