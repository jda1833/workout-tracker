from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, HTMLResponse

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parents[1]
INDEX_FILE = BASE_DIR / "data" / "index.html"
FAVICON_FILE = BASE_DIR / "assets" / "icons" / "weight-plate.svg"


def render_index(active_page: str):
    if not INDEX_FILE.exists():
        raise HTTPException(status_code=500, detail="Frontend file not found")

    html = INDEX_FILE.read_text(encoding="utf-8")
    page_ids = ("trackerPage", "checkInPage", "analyticsPage", "uploadPage", "linksPage")

    for page_id in page_ids:
        html = html.replace(
            f'<a class="nav-link active" href="/" data-page="{page_id}">',
            f'<a class="nav-link" href="/" data-page="{page_id}">',
        )
        html = html.replace(
            f'<a class="nav-link active" href="/check-in" data-page="{page_id}">',
            f'<a class="nav-link" href="/check-in" data-page="{page_id}">',
        )
        html = html.replace(
            f'<a class="nav-link active" href="/analytics" data-page="{page_id}">',
            f'<a class="nav-link" href="/analytics" data-page="{page_id}">',
        )
        html = html.replace(
            f'id="{page_id}" class="page active"',
            f'id="{page_id}" class="page"',
        )

    nav_href = "/"
    if active_page == "checkInPage":
        nav_href = "/check-in"
    if active_page == "analyticsPage":
        nav_href = "/analytics"
    html = html.replace(
        f'<a class="nav-link" href="{nav_href}" data-page="{active_page}">',
        f'<a class="nav-link active" href="{nav_href}" data-page="{active_page}">',
        1,
    )
    html = html.replace(
        f'id="{active_page}" class="page"',
        f'id="{active_page}" class="page active"',
        1,
    )

    return html


@router.get("/", response_class=HTMLResponse)
def read_root():
    return render_index("trackerPage")


@router.get("/check-in", response_class=HTMLResponse)
def read_check_in():
    return render_index("checkInPage")


@router.get("/analytics", response_class=HTMLResponse)
def read_analytics():
    return render_index("analyticsPage")


@router.get("/favicon.ico", include_in_schema=False)
def read_favicon():
    if not FAVICON_FILE.exists():
        raise HTTPException(status_code=404, detail="Favicon not found")
    return FileResponse(FAVICON_FILE, media_type="image/svg+xml")
