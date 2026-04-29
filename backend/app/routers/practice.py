from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models.practice import (
    PracticeAnswerRequest,
    PracticeAnswerResponse,
    PracticeGenerateRequest,
    PracticeGenerateResponse,
    PracticeQuestion,
    PracticeOption,
)
from app.models.study import Lesson, StudyTopic
from app.services.tutor_engine import TutorEngine
from app.services.ai_tutor_service import AiTutorService

router = APIRouter(prefix="/api/practice", tags=["practice"])


@router.post("/generate", response_model=PracticeGenerateResponse)
def generate_practice(
    payload: PracticeGenerateRequest,
    session: Session = Depends(get_session),
):
    engine = TutorEngine(session)

    result = engine.generate_practice(
        topic_id=payload.topic_id,
        question_count=payload.question_count,
    )

    if result is None:
        raise HTTPException(status_code=404, detail="Tema no encontrado.")

    if not result.questions:
        raise HTTPException(
            status_code=400,
            detail="No existen lecciones suficientes para generar preguntas.",
        )

    return result


@router.post("/generate-ai", response_model=PracticeGenerateResponse)
async def generate_practice_ai(
    payload: PracticeGenerateRequest,
    session: Session = Depends(get_session),
):
    topic = session.get(StudyTopic, payload.topic_id)

    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado.")

    lessons = session.exec(
        select(Lesson)
        .where(Lesson.study_topic_id == payload.topic_id)
        .order_by(Lesson.order)
    ).all()

    usable_lessons = [
        lesson for lesson in lessons
        if lesson.content and len(lesson.content.strip()) >= 80
    ]

    if not usable_lessons:
        raise HTTPException(
            status_code=400,
            detail="No existen lecciones suficientes para generar preguntas con IA.",
        )

    lesson = usable_lessons[0]

    ai_tutor = AiTutorService()

    try:
        ai_result = await ai_tutor.generate_questions_from_lesson(
            topic_id=topic.id or 0,
            topic_name=topic.name,
            lesson_id=lesson.id or 0,
            lesson_title=lesson.title,
            lesson_content=lesson.content,
            source=lesson.official_source,
            source_reference=lesson.source_reference,
            question_count=payload.question_count,
        )
    except Exception as ex:
        raise HTTPException(
            status_code=500,
            detail=f"No fue posible generar preguntas con IA: {str(ex)}",
        )

    raw_questions = ai_result.get("questions", [])

    questions: list[PracticeQuestion] = []

    for index, item in enumerate(raw_questions):
        options = item.get("options", [])

        if not item.get("question") or len(options) < 2:
            continue

        normalized_options: list[PracticeOption] = []

        for option in options:
            label = str(option.get("label", "")).strip().upper()
            text = str(option.get("text", "")).strip()

            if label and text:
                normalized_options.append(
                    PracticeOption(
                        label=label,
                        text=text,
                    )
                )

        correct_option = str(item.get("correct_option", "")).strip().upper()

        if not correct_option:
            continue

        if not any(option.label == correct_option for option in normalized_options):
            continue

        questions.append(
            PracticeQuestion(
                id=f"ai-{topic.id}-{lesson.id}-{index + 1}",
                topic_id=topic.id or 0,
                lesson_id=lesson.id or 0,
                question=str(item.get("question", "")).strip(),
                options=normalized_options,
                correct_option=correct_option,
                explanation=str(item.get("explanation", "")).strip()
                or "Explicación basada en el contenido local entregado.",
                source=lesson.official_source or "Contenido local TutorAcague",
                source_reference=lesson.source_reference or "Lección local",
                source_fragment=str(item.get("source_fragment", "")).strip()
                or lesson.content[:350],
                bloom_level=str(item.get("bloom_level", "understand")).strip(),
            )
        )

    if not questions:
        raise HTTPException(
            status_code=500,
            detail="La IA no generó preguntas válidas desde el contenido local.",
        )

    return PracticeGenerateResponse(
        topic_id=topic.id or 0,
        topic_name=topic.name,
        source_mode="local_ai_generated",
        questions=questions,
    )


@router.post("/answer", response_model=PracticeAnswerResponse)
def answer_practice(
    payload: PracticeAnswerRequest,
    session: Session = Depends(get_session),
):
    engine = TutorEngine(session)
    return engine.check_answer(payload)