from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from . import database, models
from .routers import pages, programs, uploads

app = FastAPI()

models.Base.metadata.create_all(bind=database.engine)

ASSETS_DIR = Path(__file__).resolve().parent / "assets"
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

app.include_router(pages.router)
app.include_router(programs.router)
app.include_router(uploads.router)
