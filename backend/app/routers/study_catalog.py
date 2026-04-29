from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models.knowledge import KnowledgeChunk
from app.models.study import Lesson, StudyArea, StudyTopic

router = APIRouter(prefix="/api/study", tags=["study-catalog"])


@router.get("/catalog")
def get_study_catalog(session: Session = Depends(get_session)):
    areas = list(
        session.exec(
            select(StudyArea).order_by(StudyArea.order)
        ).all()
    )

    result = []

    for area in areas:
        topics = list(
            session.exec(
                select(StudyTopic)
                .where(StudyTopic.study_area_id == area.id)
                .order_by(StudyTopic.order)
            ).all()
        )

        topic_items = []

        for topic in topics:
            lessons = list(
                session.exec(
                    select(Lesson)
                    .where(Lesson.study_topic_id == topic.id)
                    .order_by(Lesson.order)
                ).all()
            )

            chunks = list(
                session.exec(
                    select(KnowledgeChunk)
                    .where(KnowledgeChunk.topic_id == topic.id)
                ).all()
            )

            topic_items.append(
                {
                    "id": topic.id,
                    "name": topic.name,
                    "description": topic.description or "",
                    "order": topic.order,
                    "lessons_count": len(lessons),
                    "rag_chunks_count": len(chunks),
                    "has_content": len(lessons) > 0,
                    "has_rag": len(chunks) > 0,
                }
            )

        result.append(
            {
                "id": area.id,
                "name": area.name,
                "description": area.description or "",
                "order": area.order,
                "topics": topic_items,
            }
        )

    return result