from typing import List, Optional
from pydantic import BaseModel


class PracticeGenerateRequest(BaseModel):
    topic_id: int
    question_count: int = 5


class PracticeOption(BaseModel):
    label: str
    text: str


class PracticeQuestion(BaseModel):
    id: str
    topic_id: int
    lesson_id: int
    question: str
    options: List[PracticeOption]
    correct_option: str
    explanation: str
    source: str
    source_reference: str
    source_fragment: str
    bloom_level: str = "understand"


class PracticeGenerateResponse(BaseModel):
    topic_id: int
    topic_name: str
    source_mode: str
    questions: List[PracticeQuestion]


class PracticeAnswerRequest(BaseModel):
    question: PracticeQuestion
    selected_option: str


class PracticeAnswerResponse(BaseModel):
    is_correct: bool
    correct_option: str
    selected_option: str
    explanation: str
    source: str
    source_reference: str
    source_fragment: str