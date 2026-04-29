from pydantic import BaseModel


class TutorExplainRequest(BaseModel):
    topic_id: int
    lesson_id: int


class TutorExplainResponse(BaseModel):
    topic_id: int
    lesson_id: int
    explanation: str
    source: str
    source_reference: str