from typing import Any

import httpx
from sqlmodel import Session

from app.models.study import StudyTopic
from app.models.study_tutor import (
    StudyTutorResponse,
    StudyTutorSource,
)
from app.services.rag_service import RagService


class LlmTutorService:
    def __init__(self, session: Session):
        self.session = session
        self.ollama_url = "http://127.0.0.1:11434/api/generate"

        # Usa aquí el modelo que tengas instalado en Ollama.
        self.model = "qwen2.5:0.5b"

    def ask(
        self,
        topic_id: int,
        action: str,
        user_message: str,
        level: str = "basic",
    ) -> StudyTutorResponse:
        topic = self.session.get(StudyTopic, topic_id)

        if not topic:
            raise ValueError("Tema no encontrado.")

        rag = RagService(self.session)

        query = " ".join(
            [
                topic.name or "",
                topic.description or "",
                action or "",
                user_message or "",
            ]
        )

        rag_chunks = rag.search(topic_id=topic_id, query=query, limit=8)
        rag_context = rag.build_context(topic_id=topic_id, query=query, limit=8)

        if len(rag_context.strip()) < 300:
            raise ValueError(
                "No existe contexto RAG suficiente para este tema. "
                "Debes importar contenido real generado y validado antes de usar el tutor."
            )
        if not rag_context.strip():
            raise ValueError(
                "El tema tiene chunk RAG registrados, pero no fue posible construir el contexto. "
                "Revisa el contenido almacenado en Knowledgechunk."
            )

        prompt = self._build_prompt(
            topic_name=topic.name,
            topic_description=topic.description or "",
            source_context=rag_context,
            action=action,
            user_message=user_message,
            level=level,
        )

        answer = self._call_ollama(prompt)

        return StudyTutorResponse(
            answer=answer,
            topic_id=topic.id or topic_id,
            topic_name=topic.name,
            action=action,
            source_used=[
                StudyTutorSource(
                    title=chunk.source_title or "Fuente sin título",
                    source_reference=chunk.source_reference or "Sin referencia específica",
                    source_fragment=self._shorten(chunk.content or "", 800),
                )
                for chunk in rag_chunks
            ],
            suggested_actions=[
                "simplify",
                "deepen",
                "give_applied_example",
                "compare",
                "prepare_oral_answer",
                "clarify_confusion",
                "summarize_for_mastery",
                "generate_visual_guidance",
            ],
            requires_validation=False,
        )

    def _build_prompt(
        self,
        topic_name: str,
        topic_description: str,
        source_context: str,
        action: str,
        user_message: str,
        level: str,
    ) -> str:
        action_instruction = self._get_action_instruction(action)

        return f"""
Eres TutorAcague, un tutor pedagógico experto para una persona que se prepara para una postulación académica importante.

Tu función es enseñar de forma clara, profunda, útil y exigente.

REGLA ABSOLUTA:
Debes responder usando exclusivamente el CONTEXTO RAG ENTREGADO.
Si el contexto s breve, debes explicar unicamente lo que ese contexto permite.
No debes completar con conocimiento externo.
Si falta informacion para una explicacion profunda, puedes buscar en internet, sin salirte del tema principal.
No uses conocimiento general del modelo.
No inventes doctrina.
No agregues datos externos.
No uses ejemplos históricos si no están en el contexto.
No completes información faltante con supuestos.
Si el contexto no permite responder algo, debes decirlo claramente.

OBJETIVO PEDAGÓGICO:
El usuario no debe necesitar volver al manual para comprender el tema.
Tu tarea no es copiar el manual.
Tu tarea es transformar la fuente en una explicación superior, clara y entendible.

TEMA:
{topic_name}

DESCRIPCIÓN DEL TEMA:
{topic_description}

NIVEL DEL USUARIO:
{level}

ACCIÓN SOLICITADA:
{action}

INSTRUCCIÓN DE LA ACCIÓN:
{action_instruction}

DUDA O NECESIDAD DEL USUARIO:
{user_message or "Explícame este tema como una clase clara, profunda y útil."}

CONTEXTO RAG DISPONIBLE:
{source_context}

INSTRUCCIONES DE RESPUESTA:
1. Responde en español formal y claro.
2. Enseña como instructor, no como buscador ni lector de manual.
3. Usa solo el contexto RAG.
4. Explica conceptos difíciles.
5. Simplifica sin perder precisión.
6. Distingue entre doctrina y explicación pedagógica.
7. No inventes información.
8. No generes preguntas de evaluación salvo que el usuario lo pida.
9. Usa ejemplos solo si se pueden construir desde el contexto.
10. Termina siempre con una sección llamada "Fuente utilizada".

ESTRUCTURA RECOMENDADA:
Idea central:
Explicación clara:
En simple:
Por qué importa:
Ejemplo aplicado basado en la fuente:
Errores comunes:
Qué debe dominar el estudiante:
Fuente utilizada:
"""

    def _get_action_instruction(self, action: str) -> str:
        instructions: dict[str, str] = {
            "explain_concept": (
                "Explica el tema como una clase completa. Parte desde la idea central "
                "y avanza hacia una comprensión profunda."
            ),
            "simplify": (
                "Explica el tema en lenguaje más simple, manteniendo fidelidad al contexto RAG."
            ),
            "deepen": (
                "Profundiza el tema. Explica matices, relaciones, consecuencias y utilidad."
            ),
            "compare": (
                "Compara conceptos relacionados solo si ambos aparecen en el contexto RAG."
            ),
            "give_applied_example": (
                "Entrega un ejemplo académico basado exclusivamente en el contexto RAG."
            ),
            "prepare_oral_answer": (
                "Construye una respuesta modelo para evaluación oral, con idea central, fundamento, utilidad, relación y cierre."
            ),
            "clarify_confusion": (
                "Aclara la duda concreta del usuario usando únicamente el contexto RAG."
            ),
            "summarize_for_mastery": (
                "Resume lo que el estudiante debe dominar para considerar comprendido el tema."
            ),
            "generate_visual_guidance": (
                "Explica cómo estudiar este tema con apoyo visual, mapas, esquemas, capas o diagramas, solo si el contexto lo permite."
            ),
        }

        return instructions.get(
            action,
            "Explica el tema de forma pedagógica usando únicamente el contexto RAG.",
        )

    def _call_ollama(self, prompt: str) -> str:
        payload: dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "top_p": 0.75,
                "num_ctx": 4096,
                "num_predict": 1000,
                "repeat_penalty": 1.1,
            },
        }

        try:
            with httpx.Client(timeout=httpx.Timeout(300.0, connect=20.0)) as client:
                response = client.post(self.ollama_url, json=payload)
                response.raise_for_status()
                data = response.json()

                answer = str(data.get("response", "")).strip()

                if not answer:
                    return (
                        "El modelo local respondió, pero no generó contenido. "
                        "Revisa el modelo configurado en Ollama."
                    )

                return answer

        except httpx.TimeoutException:
            return (
                "El modelo local tardó demasiado en responder.\n\n"
                f"Modelo configurado: {self.model}\n\n"
                "Puedes usar un modelo más liviano o reducir el contexto enviado."
            )

        except Exception as ex:
            return (
                "No fue posible generar la explicación con el modelo local en este momento.\n\n"
                "Revisa que Ollama esté activo y que el modelo configurado exista.\n\n"
                f"Modelo configurado: {self.model}\n"
                f"Detalle técnico: {ex}"
            )

    def _shorten(self, text: str, max_chars: int) -> str:
        clean = " ".join(text.split())

        if len(clean) <= max_chars:
            return clean

        return clean[:max_chars].rsplit(" ", 1)[0] + "..."