from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field


class QuestionType(str, Enum):
    single_choice = "single_choice"
    multiple_choice = "multiple_choice"
    true_false = "true_false"


class BloomLevel(str, Enum):
    remember = "remember"
    understand = "understand"
    apply = "apply"


class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    study_topic_id: int = Field(foreign_key="studytopic.id")
    type: QuestionType
    bloom_level: BloomLevel
    statement: str
    explanation: str
    official_source: str = ""
    source_reference: str = ""
    difficulty: int = 1
    is_official_validated: bool = False


class QuestionOption(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: int = Field(foreign_key="question.id")
    label: str
    text: str
    is_correct: bool = False