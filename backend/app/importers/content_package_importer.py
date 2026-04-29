import json
from pathlib import Path
from typing import Any

from sqlmodel import Session, select

from app.models.study import StudyArea, StudyTopic, Lesson
from app.models.question import Question, QuestionOption, QuestionType, BloomLevel


class ContentPackageImporter:
    def __init__(self, session: Session):
        self.session = session

    def import_package(self, package_path: str | Path) -> dict[str, int]:
        path = Path(package_path)

        if not path.exists():
            raise FileNotFoundError(f"No existe el paquete: {path}")

        package = json.loads(path.read_text(encoding="utf-8"))

        lessons = package.get("lessons", [])
        questions = package.get("questions", [])

        imported_lessons = 0
        imported_questions = 0
        imported_options = 0

        for lesson_data in lessons:
            area = self._get_or_create_area(lesson_data)
            topic = self._get_or_create_topic(area, lesson_data)
            lesson = self._create_lesson(topic, lesson_data)

            if lesson:
                imported_lessons += 1

        self.session.commit()

        for question_data in questions:
            area_name = question_data.get("area", "").strip()
            topic_name = question_data.get("topic", "").strip()
            lesson_title = question_data.get("lesson_title", "").strip()

            if not area_name or not topic_name:
                continue

            area = self._find_area(area_name)
            if not area:
                continue

            topic = self._find_topic(area.id, topic_name)
            if not topic:
                continue

            lesson = self._find_lesson(topic.id, lesson_title)

            question = self._create_question(topic, lesson, question_data)

            if question:
                imported_questions += 1
                imported_options += self._create_options(question, question_data)

        self.session.commit()

        return {
            "lessons": imported_lessons,
            "questions": imported_questions,
            "options": imported_options,
        }

    def _get_or_create_area(self, lesson_data: dict[str, Any]) -> StudyArea:
        area_name = lesson_data.get("area", "").strip()

        if not area_name:
            area_name = "Área sin clasificar"

        existing = self._find_area(area_name)

        if existing:
            return existing

        area = StudyArea(
            name=area_name,
            description="Área creada desde paquete de contenidos generado.",
            weight_percentage=0,
            order=999,
        )

        self.session.add(area)
        self.session.commit()
        self.session.refresh(area)

        return area

    def _get_or_create_topic(
        self,
        area: StudyArea,
        lesson_data: dict[str, Any],
    ) -> StudyTopic:
        topic_name = lesson_data.get("topic", "").strip()

        if not topic_name:
            topic_name = "Tema sin clasificar"

        existing = self._find_topic(area.id, topic_name)

        if existing:
            return existing

        topic = StudyTopic(
            study_area_id=area.id,
            name=topic_name,
            description="Tema creado desde paquete de contenidos generado.",
            order=999,
        )

        self.session.add(topic)
        self.session.commit()
        self.session.refresh(topic)

        return topic

    def _create_lesson(
        self,
        topic: StudyTopic,
        lesson_data: dict[str, Any],
    ) -> Lesson | None:
        title = lesson_data.get("title", "").strip()
        content = lesson_data.get("content", "").strip()

        if not title or not content:
            return None

        existing = self._find_lesson(topic.id, title)

        if existing:
            existing.content = content
            existing.official_source = self._get_source_title(lesson_data)
            existing.source_reference = self._get_source_reference(lesson_data)
            existing.is_official_content = True
            self.session.add(existing)
            return existing

        lesson = Lesson(
            study_topic_id=topic.id,
            title=title,
            content=content,
            official_source=self._get_source_title(lesson_data),
            source_reference=self._get_source_reference(lesson_data),
            order=self._next_lesson_order(topic.id),
            is_official_content=True,
        )

        self.session.add(lesson)
        self.session.commit()
        self.session.refresh(lesson)

        return lesson

    def _create_question(
        self,
        topic: StudyTopic,
        lesson: Lesson | None,
        question_data: dict[str, Any],
    ) -> Question | None:
        statement = question_data.get("question", "").strip()
        explanation = question_data.get("explanation", "").strip()

        if not statement:
            return None

        question_type_value = question_data.get("type", "single_choice")
        bloom_value = question_data.get("bloom_level", "understand")

        question_type = self._safe_question_type(question_type_value)
        bloom_level = self._safe_bloom_level(bloom_value)

        source = question_data.get("source", {})
        official_source = source.get("document_title", "Contenido generado TutorAcague")
        source_reference = self._source_reference_from_source(source)

        question = Question(
            study_topic_id=topic.id,
            type=question_type,
            bloom_level=bloom_level,
            statement=statement,
            explanation=explanation,
            official_source=official_source,
            source_reference=source_reference,
            difficulty=int(question_data.get("difficulty", 1) or 1),
            is_official_validated=False,
        )

        self.session.add(question)
        self.session.commit()
        self.session.refresh(question)

        return question

    def _create_options(
        self,
        question: Question,
        question_data: dict[str, Any],
    ) -> int:
        options = question_data.get("options", [])
        correct_option = str(question_data.get("correct_option", "")).strip().upper()

        count = 0

        for option_data in options:
            label = str(option_data.get("label", "")).strip().upper()
            text = str(option_data.get("text", "")).strip()

            if not label or not text:
                continue

            option = QuestionOption(
                question_id=question.id,
                label=label,
                text=text,
                is_correct=(label == correct_option),
            )

            self.session.add(option)
            count += 1

        return count

    def _find_area(self, area_name: str) -> StudyArea | None:
        return self.session.exec(
            select(StudyArea).where(StudyArea.name == area_name)
        ).first()

    def _find_topic(self, area_id: int, topic_name: str) -> StudyTopic | None:
        return self.session.exec(
            select(StudyTopic)
            .where(StudyTopic.study_area_id == area_id)
            .where(StudyTopic.name == topic_name)
        ).first()

    def _find_lesson(self, topic_id: int, title: str) -> Lesson | None:
        return self.session.exec(
            select(Lesson)
            .where(Lesson.study_topic_id == topic_id)
            .where(Lesson.title == title)
        ).first()

    def _next_lesson_order(self, topic_id: int) -> int:
        lessons = self.session.exec(
            select(Lesson).where(Lesson.study_topic_id == topic_id)
        ).all()

        if not lessons:
            return 1

        return max(lesson.order for lesson in lessons) + 1

    def _get_source_title(self, lesson_data: dict[str, Any]) -> str:
        source = lesson_data.get("source", {})
        return source.get("document_title", "Contenido generado TutorAcague")

    def _get_source_reference(self, lesson_data: dict[str, Any]) -> str:
        source = lesson_data.get("source", {})
        return self._source_reference_from_source(source)

    def _source_reference_from_source(self, source: dict[str, Any]) -> str:
        document_version = source.get("document_version", "")
        page_start = source.get("page_start", 0)
        page_end = source.get("page_end", 0)

        parts = []

        if document_version:
            parts.append(f"Versión {document_version}")

        if page_start or page_end:
            parts.append(f"Páginas {page_start}-{page_end}")

        source_hash = source.get("source_fragment_hash")
        if source_hash:
            parts.append(f"Fragmento SHA256 {source_hash[:12]}")

        return " · ".join(parts) if parts else "Referencia generada"

    def _safe_question_type(self, value: str) -> QuestionType:
        try:
            return QuestionType(value)
        except Exception:
            return QuestionType.single_choice

    def _safe_bloom_level(self, value: str) -> BloomLevel:
        try:
            return BloomLevel(value)
        except Exception:
            return BloomLevel.understand