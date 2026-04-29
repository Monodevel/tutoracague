from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from app.models.knowledge import KnowledgeChunk

from app.database import create_db_and_tables, engine
from app.seed import seed_initial_data
from app.routers import (
    profile,
    study,
    study_catalog,
    device,
    practice,
    tutor,
    results,
    voice,
    study_session,
    visual_resources,
    study_tutor,
)

app = FastAPI(
    title="TutorAcague API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()

    with Session(engine) as session:
        seed_initial_data(session)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "TutorAcague API",
        "version": "0.1.0",
    }


app.include_router(profile.router)
app.include_router(study.router)
app.include_router(device.router)
app.include_router(practice.router)
app.include_router(tutor.router)
app.include_router(results.router)
app.include_router(voice.router)
app.include_router(study_session.router)
app.include_router(visual_resources.router)
app.include_router(study_tutor.router)
app.include_router(study_catalog.router)

app.mount("/static", StaticFiles(directory="storage/static"), name="static")