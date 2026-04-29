from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.models.study_session import (
    StudySessionAnswerRequest,
    StudySessionAnswerResponse,
    StudySessionFinishRequest,
    StudySessionFinishResponse,
    StudySessionNextRequest,
    StudySessionNextResponse,
    StudySessionStartRequest,
    StudySessionStartResponse,
)
from app.services.session_orchestrator import SessionOrchestrator

router = APIRouter(prefix="/api/study-session", tags=["study-session"])


@router.post("/start", response_model=StudySessionStartResponse)
def start_study_session(
    payload: StudySessionStartRequest,
    session: Session = Depends(get_session),
):
    try:
        orchestrator = SessionOrchestrator(session)
        study_session, steps = orchestrator.start_session(
            topic_id=payload.topic_id,
            duration_minutes=payload.duration_minutes,
        )

        return StudySessionStartResponse(
            session_id=study_session.id,
            topic_id=study_session.topic_id,
            topic_name=study_session.topic_name,
            lesson_id=study_session.lesson_id,
            lesson_title=study_session.lesson_title,
            duration_minutes=study_session.duration_minutes,
            current_step_index=study_session.current_step_index,
            total_steps=len(steps),
            step=steps[study_session.current_step_index],
        )
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/answer", response_model=StudySessionAnswerResponse)
def answer_study_session(
    payload: StudySessionAnswerRequest,
    session: Session = Depends(get_session),
):
    try:
        orchestrator = SessionOrchestrator(session)
        return orchestrator.evaluate_answer(
            session_id=payload.session_id,
            step_id=payload.step_id,
            answer=payload.answer,
        )
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/next", response_model=StudySessionNextResponse)
def next_study_session_step(
    payload: StudySessionNextRequest,
    session: Session = Depends(get_session),
):
    try:
        orchestrator = SessionOrchestrator(session)
        study_session, steps, finished = orchestrator.next_step(
            payload.session_id
        )

        if finished:
            return StudySessionNextResponse(
                session_id=study_session.id,
                current_step_index=study_session.current_step_index,
                total_steps=len(steps),
                finished=True,
                step=None,
            )

        return StudySessionNextResponse(
            session_id=study_session.id,
            current_step_index=study_session.current_step_index,
            total_steps=len(steps),
            finished=False,
            step=steps[study_session.current_step_index],
        )
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/finish", response_model=StudySessionFinishResponse)
def finish_study_session(
    payload: StudySessionFinishRequest,
    session: Session = Depends(get_session),
):
    try:
        orchestrator = SessionOrchestrator(session)
        study_session = orchestrator.finish_session(payload.session_id)

        return StudySessionFinishResponse(
            session_id=study_session.id,
            status=study_session.status,
            message="Sesión finalizada correctamente.",
        )
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))