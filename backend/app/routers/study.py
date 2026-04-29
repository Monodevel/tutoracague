from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models.study import StudyArea, StudyTopic, Lesson

router = APIRouter(prefix="/api/study", tags=["study"])


@router.get("/areas")
def get_areas(session: Session = Depends(get_session)):
    areas = session.exec(select(StudyArea).order_by(StudyArea.order)).all()

    result = []

    for area in areas:
        topics = session.exec(
            select(StudyTopic)
            .where(StudyTopic.study_area_id == area.id)
            .order_by(StudyTopic.order)
        ).all()

        result.append(
            {
                "id": area.id,
                "name": area.name,
                "description": area.description,
                "weight_percentage": area.weight_percentage,
                "order": area.order,
                "topics": topics,
            }
        )

    return result


@router.get("/topics/{topic_id}")
def get_topic(topic_id: int, session: Session = Depends(get_session)):
    topic = session.get(StudyTopic, topic_id)

    if not topic:
        return None

    lessons = session.exec(
        select(Lesson)
        .where(Lesson.study_topic_id == topic_id)
        .order_by(Lesson.order)
    ).all()

    return {
        "id": topic.id,
        "study_area_id": topic.study_area_id,
        "name": topic.name,
        "description": topic.description,
        "order": topic.order,
        "lessons": lessons,
    }