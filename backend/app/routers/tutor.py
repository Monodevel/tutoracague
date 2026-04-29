from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.models.study import Lesson, StudyTopic
from app.models.tutor import TutorExplainRequest, TutorExplainResponse
from app.services.ai_tutor_service import AiTutorService

router = APIRouter(prefix="/api/tutor", tags=["tutor"])


@router.post("/explain", response_model=TutorExplainResponse)
async def explain_lesson(
    payload: TutorExplainRequest,
    session: Session = Depends(get_session),
):
    topic = session.get(StudyTopic, payload.topic_id)
    lesson = session.get(Lesson, payload.lesson_id)

    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado.")

    if not lesson:
        raise HTTPException(status_code=404, detail="Lección no encontrada.")

    if lesson.study_topic_id != topic.id:
        raise HTTPException(
            status_code=400,
            detail="La lección no corresponde al tema indicado.",
        )

    if not lesson.content or len(lesson.content.strip()) < 40:
        raise HTTPException(
            status_code=400,
            detail="La lección no contiene información suficiente para explicar.",
        )

    ai_tutor = AiTutorService()

    explanation = await ai_tutor.explain_lesson(
        topic_name=topic.name,
        lesson_title=lesson.title,
        lesson_content=lesson.content,
        source=lesson.official_source,
        source_reference=lesson.source_reference,
    )

    return TutorExplainResponse(
        topic_id=topic.id,
        lesson_id=lesson.id,
        explanation=explanation,
        source=lesson.official_source,
        source_reference=lesson.source_reference,
    )