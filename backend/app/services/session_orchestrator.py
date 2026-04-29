import re
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlmodel import Session, select

from app.models.study import Lesson, StudyTopic
from app.models.study_session import (
    IntegratedStudySession,
    StudySessionAnswerResponse,
    StudySessionInteraction,
    StudySessionStepRead,
)


class SessionOrchestrator:
    def __init__(self, session: Session):
        self.session = session

    def start_session(
        self,
        topic_id: int,
        duration_minutes: int = 45,
    ) -> tuple[IntegratedStudySession, list[StudySessionStepRead]]:
        topic = self.session.get(StudyTopic, topic_id)

        if not topic:
            raise ValueError("Tema no encontrado.")

        lesson = self.session.exec(
            select(Lesson)
            .where(Lesson.study_topic_id == topic_id)
            .order_by(Lesson.order)
        ).first()

        if not lesson:
            raise ValueError("El tema no tiene lecciones cargadas.")

        session_id = str(uuid.uuid4())

        study_session = IntegratedStudySession(
            id=session_id,
            topic_id=topic.id or 0,
            topic_name=topic.name,
            lesson_id=lesson.id,
            lesson_title=lesson.title,
            duration_minutes=duration_minutes,
            current_step_index=0,
            status="active",
        )

        self.session.add(study_session)
        self.session.commit()
        self.session.refresh(study_session)

        steps = self.build_steps(topic, lesson, duration_minutes)

        return study_session, steps

    def get_session(self, session_id: str) -> IntegratedStudySession:
        study_session = self.session.get(IntegratedStudySession, session_id)

        if not study_session:
            raise ValueError("Sesión no encontrada.")

        return study_session

    def get_steps_for_session(
        self,
        study_session: IntegratedStudySession,
    ) -> list[StudySessionStepRead]:
        if not study_session.lesson_id:
            raise ValueError("La sesión no tiene lección asociada.")

        topic = self.session.get(StudyTopic, study_session.topic_id)
        lesson = self.session.get(Lesson, study_session.lesson_id)

        if not topic or not lesson:
            raise ValueError("No fue posible reconstruir la sesión.")

        return self.build_steps(topic, lesson, study_session.duration_minutes)

    def next_step(
        self,
        session_id: str,
    ) -> tuple[IntegratedStudySession, list[StudySessionStepRead], bool]:
        study_session = self.get_session(session_id)
        steps = self.get_steps_for_session(study_session)

        next_index = study_session.current_step_index + 1

        if next_index >= len(steps):
            study_session.status = "finished"
            study_session.finished_at = datetime.now(UTC)
            self.session.add(study_session)
            self.session.commit()
            self.session.refresh(study_session)

            return study_session, steps, True

        study_session.current_step_index = next_index
        self.session.add(study_session)
        self.session.commit()
        self.session.refresh(study_session)

        return study_session, steps, False

    def finish_session(self, session_id: str) -> IntegratedStudySession:
        study_session = self.get_session(session_id)
        study_session.status = "finished"
        study_session.finished_at = datetime.now(UTC)

        self.session.add(study_session)
        self.session.commit()
        self.session.refresh(study_session)

        return study_session

    def evaluate_answer(
        self,
        session_id: str,
        step_id: str,
        answer: str,
    ) -> StudySessionAnswerResponse:
        study_session = self.get_session(session_id)
        steps = self.get_steps_for_session(study_session)

        step = next((item for item in steps if item.id == step_id), None)

        if not step:
            raise ValueError("Paso no encontrado en la sesión.")

        clean_answer = answer.strip()

        if not clean_answer:
            response = StudySessionAnswerResponse(
                is_acceptable=False,
                conceptual_accuracy=0,
                depth=0,
                source_alignment=0,
                clarity=0,
                feedback=(
                    "No entregaste una respuesta. En una preparación seria no basta con avanzar; "
                    "debes intentar explicar, fundamentar o defender una idea."
                ),
                follow_up_question=step.question,
                can_continue=False,
            )

            self._save_interaction(study_session, step, clean_answer, response)
            return response

        scores = self._score_answer(clean_answer, step.source_fragment)

        is_acceptable = (
            scores["conceptual_accuracy"] >= 45
            and scores["depth"] >= 40
            and scores["clarity"] >= 40
        )

        feedback = self._build_feedback(
            answer=clean_answer,
            step=step,
            scores=scores,
            is_acceptable=is_acceptable,
        )

        follow_up_question = None

        if not is_acceptable:
            follow_up_question = (
                "Reformula tu respuesta incorporando mayor precisión conceptual, "
                "relación con la fuente y una explicación más desarrollada."
            )
        elif scores["depth"] < 70:
            follow_up_question = (
                "La respuesta es aceptable, pero aún puede profundizar. "
                "Agrega una consecuencia, relación o aplicación práctica del concepto."
            )

        response = StudySessionAnswerResponse(
            is_acceptable=is_acceptable,
            conceptual_accuracy=scores["conceptual_accuracy"],
            depth=scores["depth"],
            source_alignment=scores["source_alignment"],
            clarity=scores["clarity"],
            feedback=feedback,
            follow_up_question=follow_up_question,
            can_continue=is_acceptable,
        )

        self._save_interaction(study_session, step, clean_answer, response)

        return response

    def build_steps(
        self,
        topic: StudyTopic,
        lesson: Lesson,
        duration_minutes: int,
    ) -> list[StudySessionStepRead]:
        content = lesson.content.strip()
        source = lesson.official_source or "Contenido local TutorAcague"
        source_reference = lesson.source_reference or "Referencia local"
        fragment = self._shorten(content, 1800)

        teaching_explanation = self._build_teaching_explanation(topic.name, content)
        simplified_explanation = self._build_simplified_explanation(topic.name, content)
        key_points = self._build_key_points(content)
        analysis_explanation = self._build_analysis_explanation(topic.name, content)
        deepening_explanation = self._build_deepening_explanation(topic.name, content)
        relationships_explanation = self._build_relationships_explanation(topic.name)
        common_errors = self._build_common_errors(topic.name)
        study_closing = self._build_study_closing(topic.name)

        steps: list[dict[str, Any]] = [
            {
                "id": "opening",
                "phase": "opening",
                "title": "Inicio del estudio",
                "message": (
                    f"Iniciaremos el estudio de {topic.name}. "
                    "En esta sección no se busca evaluarte ni hacerte responder preguntas como en una prueba. "
                    "El objetivo es que aprendas, comprendas, analices y puedas explicar la materia con tus propias palabras. "
                    "Primero revisarás la explicación doctrinaria, luego una versión simplificada, después los conceptos clave "
                    "y finalmente una profundización orientada a preparación seria."
                ),
                "action": "Comprender el objetivo del estudio.",
            },
            {
                "id": "teaching",
                "phase": "teaching",
                "title": "Explicación doctrinaria",
                "message": teaching_explanation,
                "action": "Estudiar la explicación principal del contenido.",
            },
            {
                "id": "simplification",
                "phase": "simplification",
                "title": "Explicación en simple",
                "message": simplified_explanation,
                "action": "Comprender el contenido en lenguaje más directo.",
            },
            {
                "id": "key_concepts",
                "phase": "key_concepts",
                "title": "Conceptos clave",
                "message": (
                    "Estos son los puntos que debes dominar antes de pasar a práctica. "
                    "No basta con reconocerlos; debes ser capaz de explicarlos, relacionarlos y aplicarlos.\n\n"
                    f"{key_points}"
                ),
                "action": "Identificar las ideas principales del tema.",
            },
            {
                "id": "analysis",
                "phase": "analysis",
                "title": "Análisis del contenido",
                "message": analysis_explanation,
                "action": "Analizar utilidad, relevancia y consecuencias del contenido.",
            },
            {
                "id": "deepening",
                "phase": "deepening",
                "title": "Profundización",
                "message": deepening_explanation,
                "action": "Profundizar la comprensión del tema.",
            },
            {
                "id": "relationships",
                "phase": "relationships",
                "title": "Relación con otros contenidos",
                "message": relationships_explanation,
                "action": "Relacionar el tema con otros elementos de estudio.",
            },
            {
                "id": "common_errors",
                "phase": "common_errors",
                "title": "Errores comunes de comprensión",
                "message": common_errors,
                "action": "Reconocer errores típicos para evitarlos.",
            },
            {
                "id": "closing",
                "phase": "closing",
                "title": "Cierre del aprendizaje",
                "message": study_closing,
                "action": "Cerrar el estudio y decidir el siguiente paso.",
            },
        ]

        if duration_minutes <= 15:
            selected = [
                steps[0],
                steps[1],
                steps[2],
                steps[3],
                steps[8],
            ]
        elif duration_minutes <= 30:
            selected = [
                steps[0],
                steps[1],
                steps[2],
                steps[3],
                steps[4],
                steps[5],
                steps[8],
            ]
        else:
            selected = steps

        return [
            StudySessionStepRead(
                id=item["id"],
                order=index + 1,
                phase=item["phase"],
                title=item["title"],
                tutor_message=item["message"],
                expected_user_action=item["action"],
                requires_response=False,
                question=None,
                source=source,
                source_reference=source_reference,
                source_fragment=fragment,
            )
            for index, item in enumerate(selected)
        ]
    def _build_teaching_explanation(self, topic_name: str, content: str) -> str:
        fragment = self._shorten(content, 2200)

        return (
            f"Vamos a estudiar {topic_name} desde la documentación cargada en TutorAcague.\n\n"
            "La idea no es memorizar frases aisladas. Debes comprender qué significa el contenido, "
            "para qué sirve y cómo se relaciona con el análisis y la toma de decisiones.\n\n"
            "Contenido base:\n\n"
            f"{fragment}\n\n"
            "Lo importante es que distingas tres niveles de comprensión:\n\n"
            "1. La idea central: qué dice realmente el contenido.\n"
            "2. La utilidad: para qué sirve dentro del proceso doctrinario o militar.\n"
            "3. La consecuencia: qué ocurre si se aplica mal, tarde o de forma superficial.\n\n"
            "Durante el estudio debes evitar quedarte solo con una definición. "
            "El objetivo es que puedas explicar el tema con claridad, relacionarlo y usarlo como herramienta de análisis."
        )


    def _build_simplified_explanation(self, topic_name: str, content: str) -> str:
        fragment = self._shorten(content, 1000)

        return (
            f"Ahora veamos {topic_name} en términos más simples.\n\n"
            "Cuando estudies este tema, piensa en estas preguntas básicas:\n\n"
            "- ¿Qué problema intenta resolver?\n"
            "- ¿Qué información o conocimiento entrega?\n"
            "- ¿A quién ayuda a decidir mejor?\n"
            "- ¿Qué riesgo aparece si se entiende de forma incompleta?\n\n"
            "En simple, el contenido debe ayudarte a pasar desde datos o antecedentes aislados "
            "hacia una comprensión útil, ordenada y aplicable.\n\n"
            "Fragmento base simplificado:\n\n"
            f"{fragment}\n\n"
            "La clave es esta: no basta con saber que el concepto existe. "
            "Debes comprender cómo funciona, por qué importa y cómo se conecta con otros elementos del estudio."
        )


    def _build_analysis_explanation(self, topic_name: str, content: str) -> str:
        return (
            f"Analicemos por qué {topic_name} es importante.\n\n"
            "Un contenido doctrinario no debe estudiarse como una lista de frases para repetir. "
            "Debe estudiarse como una herramienta para interpretar situaciones, reconocer variables críticas, "
            "reducir incertidumbre y apoyar decisiones.\n\n"
            "Para analizar este tema correctamente, considera lo siguiente:\n\n"
            "1. Relación con la incertidumbre: el contenido ayuda a ordenar antecedentes y disminuir vacíos de conocimiento.\n"
            "2. Relación con la oportunidad: una información útil pierde valor si llega tarde o no se difunde a quien corresponde.\n"
            "3. Relación con la decisión: el valor del contenido está en apoyar una acción, una planificación o una conducción.\n"
            "4. Relación con el riesgo: comprender mal el tema puede llevar a conclusiones débiles o decisiones mal fundamentadas.\n"
            "5. Relación con el análisis: no basta acumular datos; hay que evaluarlos, integrarlos e interpretarlos.\n\n"
            "Por eso, al estudiar este tema, debes preguntarte siempre: ¿qué permite entender mejor?, "
            "¿qué decisión apoya?, ¿qué riesgo reduce?, ¿qué relación tiene con el resto del proceso?"
        )


    def _build_deepening_explanation(self, topic_name: str, content: str) -> str:
        return (
            f"Profundicemos {topic_name}.\n\n"
            "Una comprensión básica permite definir el tema. Una comprensión superior permite usarlo para razonar. "
            "En preparación ACAGUE, debes apuntar a esta segunda capacidad.\n\n"
            "Profundizar implica:\n\n"
            "- reconocer la idea central;\n"
            "- distinguir elementos principales y secundarios;\n"
            "- relacionar el tema con otros procesos;\n"
            "- identificar consecuencias de una mala aplicación;\n"
            "- explicar por qué el concepto es útil en una situación concreta;\n"
            "- detectar respuestas superficiales o incompletas.\n\n"
            "Una respuesta débil sería limitarse a repetir una definición. "
            "Una respuesta sólida explica el concepto, lo relaciona con el proceso correspondiente "
            "y muestra su utilidad práctica.\n\n"
            "La exigencia no está en memorizar más palabras, sino en comprender mejor la función que cumple el contenido."
        )


    def _build_relationships_explanation(self, topic_name: str) -> str:
        return (
            f"{topic_name} no debe estudiarse de forma aislada.\n\n"
            "Para preparar adecuadamente el tema, debes relacionarlo con:\n\n"
            "- el proceso de toma de decisiones;\n"
            "- la planificación;\n"
            "- la reducción de incertidumbre;\n"
            "- la oportunidad de la información;\n"
            "- la seguridad;\n"
            "- la coordinación entre niveles;\n"
            "- la necesidad de transformar antecedentes en conocimiento útil.\n\n"
            "Cuando un estudiante no logra relacionar el contenido, normalmente termina entregando respuestas generales. "
            "Por eso, en una explicación seria, debes ser capaz de decir no solo qué es el concepto, "
            "sino cómo se conecta con el resto de la materia."
        )


    def _build_common_errors(self, topic_name: str) -> str:
        return (
            f"Errores comunes al estudiar {topic_name}:\n\n"
            "1. Memorizar una definición sin comprender su utilidad.\n"
            "2. Confundir información con conocimiento útil.\n"
            "3. No explicar la relación con la toma de decisiones.\n"
            "4. Omitir la importancia de la oportunidad.\n"
            "5. Responder de forma demasiado general.\n"
            "6. No diferenciar entre hechos confirmados, antecedentes por validar e inferencias.\n"
            "7. No relacionar el tema con otros procesos o funciones.\n\n"
            "Una respuesta aceptable debe ser precisa, ordenada y fundada. "
            "Una respuesta superior debe, además, mostrar análisis y relación."
        )


    def _build_study_closing(self, topic_name: str) -> str:
        return (
            f"Has finalizado el estudio guiado de {topic_name}.\n\n"
            "Antes de pasar a práctica, deberías poder hacer lo siguiente:\n\n"
            "- explicar la idea central del tema;\n"
            "- resumirlo en palabras simples;\n"
            "- identificar sus conceptos clave;\n"
            "- explicar por qué es importante;\n"
            "- relacionarlo con otros contenidos;\n"
            "- reconocer errores comunes de comprensión.\n\n"
            "Si todavía solo puedes repetir frases del texto, conviene repasar. "
            "Si ya puedes explicar, analizar y relacionar, entonces estás en condiciones de pasar a práctica, debate o examen oral."
        )

    def _build_key_points(self, content: str) -> str:
        sentences = [
            sentence.strip()
            for sentence in content.replace("\n", " ").split(".")
            if len(sentence.strip()) > 80
        ]

        selected = sentences[:6]

        if not selected:
            return (
                "- Identificar la idea central del contenido.\n"
                "- Explicar su utilidad dentro del tema estudiado.\n"
                "- Relacionarlo con la toma de decisiones.\n"
                "- Reconocer consecuencias de una mala aplicación.\n"
                "- Diferenciar información, análisis y conocimiento útil."
            )

        return "\n".join(
            f"- {self._shorten(sentence, 260)}."
            for sentence in selected
        )

    def _score_answer(self, answer: str, source_fragment: str) -> dict[str, int]:
        answer_words = self._keywords(answer)
        source_words = self._keywords(source_fragment)

        overlap = len(answer_words.intersection(source_words))

        conceptual_accuracy = min(100, 25 + overlap * 10)
        source_alignment = min(100, 20 + overlap * 12)

        length = len(answer)
        if length >= 450:
            depth = 90
        elif length >= 250:
            depth = 75
        elif length >= 120:
            depth = 55
        elif length >= 60:
            depth = 40
        else:
            depth = 20

        sentence_count = max(1, len(re.findall(r"[.!?]", answer)))
        clarity = 45

        if sentence_count >= 2:
            clarity += 20

        if "," in answer or ";" in answer:
            clarity += 10

        if len(answer_words) >= 18:
            clarity += 15

        clarity = min(100, clarity)

        return {
            "conceptual_accuracy": conceptual_accuracy,
            "depth": depth,
            "source_alignment": source_alignment,
            "clarity": clarity,
        }

    def _build_feedback(
        self,
        answer: str,
        step: StudySessionStepRead,
        scores: dict[str, int],
        is_acceptable: bool,
    ) -> str:
        if not is_acceptable:
            return (
                "Tu respuesta todavía no es suficiente. "
                "Puede tener una idea inicial, pero no demuestra profundidad ni fundamento adecuado. "
                f"Precisión conceptual: {scores['conceptual_accuracy']}%. "
                f"Profundidad: {scores['depth']}%. "
                f"Alineación con la fuente: {scores['source_alignment']}%. "
                "Debes reformular con mayor orden, relación con el contenido y una explicación más clara."
            )

        if scores["depth"] < 70:
            return (
                "La respuesta es aceptable, pero aún básica. "
                "Cumple parcialmente con la idea central, aunque necesita mayor análisis. "
                "Para preparación ACAGUE debes avanzar desde la definición hacia la relación, consecuencia y aplicación."
            )

        return (
            "Respuesta aceptable. Presentas una explicación con suficiente desarrollo y relación con la fuente. "
            "Mantén este nivel, pero procura siempre fundamentar y evitar respuestas meramente declarativas."
        )

    def _save_interaction(
        self,
        study_session: IntegratedStudySession,
        step: StudySessionStepRead,
        answer: str,
        response: StudySessionAnswerResponse,
    ) -> None:
        interaction = StudySessionInteraction(
            session_id=study_session.id,
            step_id=step.id,
            phase=step.phase,
            user_answer=answer,
            tutor_feedback=response.feedback,
            conceptual_accuracy=response.conceptual_accuracy,
            depth=response.depth,
            source_alignment=response.source_alignment,
            clarity=response.clarity,
            is_acceptable=response.is_acceptable,
        )

        self.session.add(interaction)
        self.session.commit()

    def _keywords(self, text: str) -> set[str]:
        words = re.findall(r"\b[a-záéíóúñü]{5,}\b", text.lower())

        stopwords = {
            "sobre",
            "entre",
            "desde",
            "hasta",
            "donde",
            "cuando",
            "porque",
            "puede",
            "deben",
            "deber",
            "tener",
            "forma",
            "tema",
            "contenido",
            "respuesta",
        }

        return {word for word in words if word not in stopwords}

    def _shorten(self, text: str, max_chars: int) -> str:
        clean = " ".join(text.split())

        if len(clean) <= max_chars:
            return clean

        return clean[:max_chars].rsplit(" ", 1)[0] + "..."