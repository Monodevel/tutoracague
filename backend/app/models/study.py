from typing import Optional
from sqlmodel import SQLModel, Field


class StudyArea(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str = ""
    weight_percentage: float = 0
    order: int = 0


class StudyTopic(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    study_area_id: int = Field(foreign_key="studyarea.id")
    name: str
    description: str = ""
    order: int = 0


class Lesson(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    study_topic_id: int = Field(foreign_key="studytopic.id")
    title: str
    content: str
    official_source: str = ""
    source_reference: str = ""
    order: int = 0
    is_official_content: bool = True