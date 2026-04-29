from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models.knowledge import KnowledgeChunk
from app.models.study import Lesson, StudyTopic
from app.models.study_tutor import StudyTutorRequest, StudyTutorResponse
from app.services.llm_tutor_service import LlmTutorService
from app.services.rag_service import RagService

router = APIRouter(prefix="/api/study-tutor", tags=["study-tutor"])


@router.post("/ask", response_model=StudyTutorResponse)
def ask_study_tutor(
    payload: StudyTutorRequest,
    session: Session = Depends(get_session),
):
    try:
        service = LlmTutorService(session)
        return service.ask(
            topic_id=payload.topic_id,
            action=payload.action,
            user_message=payload.user_message,
            level=payload.level,
        )
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.get("/debug-context/{topic_id}")
def debug_study_tutor_context(
    topic_id: int,
    session: Session = Depends(get_session),
):
    topic = session.get(StudyTopic, topic_id)

    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado.")

    lessons = list(
        session.exec(
            select(Lesson)
            .where(Lesson.study_topic_id == topic_id)
            .order_by(Lesson.order)
        ).all()
    )

    return {
        "topic": {
            "id": topic.id,
            "name": topic.name,
            "description": topic.description,
        },
        "lessons_count": len(lessons),
        "lessons": [
            {
                "id": lesson.id,
                "title": lesson.title,
                "source_reference": getattr(lesson, "source_reference", ""),
                "content_length": len(getattr(lesson, "content", "") or ""),
                "content_preview": (getattr(lesson, "content", "") or "")[:1200],
            }
            for lesson in lessons
        ],
    }


@router.get("/debug-rag/{topic_id}")
def debug_rag_context(
    topic_id: int,
    session: Session = Depends(get_session),
):
    topic = session.get(StudyTopic, topic_id)

    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado.")

    chunks = list(
        session.exec(
            select(KnowledgeChunk)
            .where(KnowledgeChunk.topic_id == topic_id)
            .order_by(KnowledgeChunk.chunk_index)
        ).all()
    )

    return {
        "topic": {
            "id": topic.id,
            "name": topic.name,
            "description": topic.description,
        },
        "chunks_count": len(chunks),
        "chunks": [
            {
                "id": chunk.id,
                "lesson_id": chunk.lesson_id,
                "source_title": chunk.source_title,
                "source_reference": chunk.source_reference,
                "content_origin": chunk.content_origin,
                "content_length": len(chunk.content or ""),
                "content_preview": (chunk.content or "")[:900],
            }
            for chunk in chunks[:30]
        ],
    }


@router.post("/reindex-rag/{topic_id}")
def reindex_rag_for_topic(
    topic_id: int,
    session: Session = Depends(get_session),
):
    topic = session.get(StudyTopic, topic_id)

    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado.")

    lessons = list(
        session.exec(
            select(Lesson)
            .where(Lesson.study_topic_id == topic_id)
            .order_by(Lesson.order)
        ).all()
    )

    rag = RagService(session)

    for lesson in lessons:
        rag.index_lesson(
            lesson=lesson,
            topic=topic,
            package_name="manual_reindex",
            package_version="dev",
            content_origin="official_source",
        )

    chunks_count = len(
        session.exec(
            select(KnowledgeChunk).where(KnowledgeChunk.topic_id == topic_id)
        ).all()
    )

    return {
        "topic_id": topic_id,
        "lessons_indexed": len(lessons),
        "chunks_count": chunks_count,
    }