from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from sqlmodel import SQLModel, Field


class PracticeResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    topic_id: int = Field(index=True)
    topic_name: str

    source_mode: str = "unknown"

    total_questions: int = 0
    correct_answers: int = 0
    incorrect_answers: int = 0
    score_percentage: float = 0

    created_at: datetime = Field(default_factory=datetime.utcnow)


class PracticeResultCreate(BaseModel):
    topic_id: int
    topic_name: str
    source_mode: str
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    score_percentage: float


class PracticeResultRead(BaseModel):
    id: int
    topic_id: int
    topic_name: str
    source_mode: str
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    score_percentage: float
    created_at: datetime


class ProgressSummary(BaseModel):
    total_sessions: int
    average_score: float
    best_score: float
    last_score: float
    weakest_topics: list[dict]
    recent_results: list[PracticeResultRead]