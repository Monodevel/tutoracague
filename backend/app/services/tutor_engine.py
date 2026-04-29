from sqlmodel import Session, select

from app.models.practice import (
    PracticeAnswerRequest,
    PracticeAnswerResponse,
    PracticeGenerateResponse,
)
from app.models.study import Lesson, StudyTopic
from app.services.question_generator import QuestionGenerator


class TutorEngine:
    def __init__(self, session: Session):
        self.session = session
        self.question_generator = QuestionGenerator()

    def generate_practice(
        self,
        topic_id: int,
        question_count: int = 5,
    ) -> PracticeGenerateResponse | None:
        topic = self.session.get(StudyTopic, topic_id)

        if not topic:
            return None

        lessons = self.session.exec(
            select(Lesson)
            .where(Lesson.study_topic_id == topic_id)
            .order_by(Lesson.order)
        ).all()

        questions = self.question_generator.generate_from_lessons(
            topic=topic,
            lessons=lessons,
            question_count=question_count,
        )

        return PracticeGenerateResponse(
            topic_id=topic.id or 0,
            topic_name=topic.name,
            source_mode="local_official_content",
            questions=questions,
        )

    def check_answer(
        self,
        payload: PracticeAnswerRequest,
    ) -> PracticeAnswerResponse:
        is_correct = (
            payload.selected_option.strip().upper()
            == payload.question.correct_option.strip().upper()
        )

        if is_correct:
            explanation = (
                "Respuesta correcta. La alternativa seleccionada coincide con el "
                "contenido usado como respaldo para esta pregunta."
            )
        else:
            explanation = (
                "Respuesta incorrecta. La corrección se realiza utilizando el fragmento "
                "fuente asociado a la pregunta. Revise nuevamente el contenido citado."
            )

        return PracticeAnswerResponse(
            is_correct=is_correct,
            correct_option=payload.question.correct_option,
            selected_option=payload.selected_option,
            explanation=f"{explanation} {payload.question.explanation}",
            source=payload.question.source,
            source_reference=payload.question.source_reference,
            source_fragment=payload.question.source_fragment,
        )