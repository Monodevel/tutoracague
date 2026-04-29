from app.services.ollama_service import OllamaService


class AiTutorService:
    def __init__(self):
        self.ollama = OllamaService()

    async def explain_lesson(
        self,
        topic_name: str,
        lesson_title: str,
        lesson_content: str,
        source: str,
        source_reference: str,
    ) -> str:
        prompt = f"""
Eres TutorAcague, un tutor de estudio para preparación ACAGUE.

REGLAS OBLIGATORIAS:
1. No inventes información.
2. No uses conocimiento general del modelo.
3. Solo puedes usar el contenido entregado en la sección CONTENIDO OFICIAL LOCAL.
4. Si el contenido no es suficiente, debes decir: "No existe información suficiente en el contenido local para explicar ese punto."
5. No agregues fechas, nombres, doctrinas, hechos o detalles que no estén en el contenido.
6. Tu respuesta debe ser clara, pedagógica y breve.

TEMA:
{topic_name}

LECCIÓN:
{lesson_title}

FUENTE:
{source}

REFERENCIA:
{source_reference}

CONTENIDO OFICIAL LOCAL:
\"\"\"
{lesson_content}
\"\"\"

TAREA:
Explica el contenido anterior como tutor. Primero entrega una explicación simple,
luego enumera 3 ideas clave, y finalmente propone una recomendación de estudio.
"""

        return await self.ollama.generate(prompt)

    async def generate_questions_from_lesson(
        self,
        topic_id: int,
        topic_name: str,
        lesson_id: int,
        lesson_title: str,
        lesson_content: str,
        source: str,
        source_reference: str,
        question_count: int = 5,
    ) -> dict:
        prompt = f"""
Eres TutorAcague, un generador de preguntas de estudio.

REGLAS OBLIGATORIAS:
1. No inventes información.
2. No uses conocimiento general del modelo.
3. Solo puedes crear preguntas usando el contenido entregado.
4. Cada pregunta debe poder responderse usando únicamente el contenido local.
5. Si el contenido no permite generar preguntas, devuelve un arreglo vacío.
6. No agregues hechos, fechas, nombres, datos o detalles que no aparezcan en el contenido.
7. Las alternativas incorrectas no deben introducir información falsa específica; deben ser distractores genéricos o interpretaciones no respaldadas.
8. Devuelve exclusivamente JSON válido. No agregues explicación fuera del JSON.

TEMA:
{topic_name}

LECCIÓN:
{lesson_title}

FUENTE:
{source}

REFERENCIA:
{source_reference}

CONTENIDO OFICIAL LOCAL:
\"\"\"
{lesson_content}
\"\"\"

FORMATO JSON OBLIGATORIO:
{{
  "questions": [
    {{
      "question": "Pregunta basada solo en el contenido",
      "options": [
        {{"label": "A", "text": "Alternativa A"}},
        {{"label": "B", "text": "Alternativa B"}},
        {{"label": "C", "text": "Alternativa C"}},
        {{"label": "D", "text": "Alternativa D"}}
      ],
      "correct_option": "A",
      "explanation": "Explicación basada solo en el contenido",
      "source_fragment": "Fragmento textual o resumido del contenido usado como respaldo",
      "bloom_level": "remember|understand|apply"
    }}
  ]
}}

Genera máximo {question_count} preguntas.
"""

        return await self.ollama.generate_json(prompt)