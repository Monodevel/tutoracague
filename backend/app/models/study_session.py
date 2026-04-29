from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class IntegratedStudySession(SQLModel, table=True):
    id: str = Field(primary_key=True)

    topic_id: int = Field(index=True)
    topic_name: str

    lesson_id: Optional[int] = None
    lesson_title: Optional[str] = None

    duration_minutes: int = 45
    current_step_index: int = 0

    status: str = "active"

    started_at: datetime = Field(default_factory=datetime.utcnow)
    finished_at: Optional[datetime] = None


class StudySessionInteraction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    session_id: str = Field(index=True)
    step_id: str

    phase: str
    user_answer: str
    tutor_feedback: str

    conceptual_accuracy: int = 0
    depth: int = 0
    source_alignment: int = 0
    clarity: int = 0

    is_acceptable: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class StudySessionStartRequest(BaseModel):
    topic_id: int
    duration_minutes: int = 45


class StudySessionStepRead(BaseModel):
    id: str
    order: int
    phase: str
    title: str
    tutor_message: str
    expected_user_action: str
    requires_response: bool = False
    question: Optional[str] = None
    source: str
    source_reference: str
    source_fragment: str


class StudySessionStartResponse(BaseModel):
    session_id: str
    topic_id: int
    topic_name: str
    lesson_id: Optional[int]
    lesson_title: Optional[str]
    duration_minutes: int
    current_step_index: int
    total_steps: int
    step: StudySessionStepRead


class StudySessionAnswerRequest(BaseModel):
    session_id: str
    step_id: str
    answer: str


class StudySessionAnswerResponse(BaseModel):
    is_acceptable: bool
    conceptual_accuracy: int
    depth: int
    source_alignment: int
    clarity: int
    feedback: str
    follow_up_question: Optional[str] = None
    can_continue: bool


class StudySessionNextRequest(BaseModel):
    session_id: str


class StudySessionNextResponse(BaseModel):
    session_id: str
    current_step_index: int
    total_steps: int
    finished: bool
    step: Optional[StudySessionStepRead] = None


class StudySessionFinishRequest(BaseModel):
    session_id: str


class StudySessionFinishResponse(BaseModel):
    session_id: str
    status: str
    message: str