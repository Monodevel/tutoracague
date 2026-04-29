import re
import uuid
from typing import List

from app.models.practice import PracticeOption, PracticeQuestion
from app.models.study import Lesson, StudyTopic


class QuestionGenerator:
    """
    Generador inicial de preguntas basado exclusivamente en contenido local.

    Esta versión NO inventa datos externos. Solo toma fragmentos existentes
    de lecciones cargadas y genera preguntas básicas de comprensión.

    Más adelante este servicio será reemplazado o complementado por IA local
    usando Ollama/llama.cpp, manteniendo la misma interfaz.
    """

    def generate_from_lessons(
        self,
        topic: StudyTopic,
        lessons: List[Lesson],
        question_count: int = 5,
    ) -> List[PracticeQuestion]:
        questions: List[PracticeQuestion] = []

        usable_lessons = [
            lesson for lesson in lessons
            if lesson.content and len(lesson.content.strip()) > 40
        ]

        if not usable_lessons:
            return questions

        for lesson in usable_lessons:
            fragments = self._split_into_fragments(lesson.content)

            for fragment in fragments:
                if len(questions) >= question_count:
                    break

                question = self._build_question_from_fragment(
                    topic=topic,
                    lesson=lesson,
                    fragment=fragment,
                )

                if question:
                    questions.append(question)

            if len(questions) >= question_count:
                break

        return questions

    def _split_into_fragments(self, content: str) -> List[str]:
        clean = re.sub(r"\s+", " ", content).strip()

        sentences = re.split(r"(?<=[.!?])\s+", clean)

        fragments: List[str] = []
        current = ""

        for sentence in sentences:
            if not sentence:
                continue

            if len(current) + len(sentence) < 360:
                current = f"{current} {sentence}".strip()
            else:
                if len(current) > 80:
                    fragments.append(current)
                current = sentence

        if len(current) > 80:
            fragments.append(current)

        if not fragments and len(clean) > 80:
            fragments.append(clean[:360])

        return fragments

    def _build_question_from_fragment(
        self,
        topic: StudyTopic,
        lesson: Lesson,
        fragment: str,
    ) -> PracticeQuestion | None:
        topic_name = topic.name

        correct_text = self._make_correct_answer(fragment)
        distractors = self._make_distractors(topic_name)

        options = [
            PracticeOption(label="A", text=distractors[0]),
            PracticeOption(label="B", text=correct_text),
            PracticeOption(label="C", text=distractors[1]),
            PracticeOption(label="D", text=distractors[2]),
        ]

        return PracticeQuestion(
            id=str(uuid.uuid4()),
            topic_id=topic.id or 0,
            lesson_id=lesson.id or 0,
            question=f"Según el contenido estudiado, ¿cuál de las siguientes alternativas se relaciona mejor con {topic_name}?",
            options=options,
            correct_option="B",
            explanation=(
                "La alternativa correcta se fundamenta directamente en el fragmento "
                "del contenido local utilizado para generar esta pregunta. "
                "TutorAcague no utilizó información externa para esta práctica."
            ),
            source=lesson.official_source or "Contenido local TutorAcague",
            source_reference=lesson.source_reference or "Lección local",
            source_fragment=fragment,
            bloom_level="understand",
        )

    def _make_correct_answer(self, fragment: str) -> str:
        fragment = fragment.strip()

        if len(fragment) <= 220:
            return fragment

        return fragment[:217].rstrip() + "..."

    def _make_distractors(self, topic_name: str) -> List[str]:
        return [
            f"Una afirmación general no respaldada por el contenido específico de {topic_name}.",
            "Una interpretación que no se desprende directamente del fragmento estudiado.",
            "Una alternativa que corresponde a información no contenida en la lección local.",
        ]