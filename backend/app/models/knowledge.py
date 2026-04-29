from datetime import UTC, datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class KnowledgeChunk(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    package_name: str = Field(default="", index=True)
    package_version: str = Field(default="", index=True)

    area_id: Optional[int] = Field(default=None, index=True)
    topic_id: Optional[int] = Field(default=None, index=True)
    lesson_id: Optional[int] = Field(default=None, index=True)

    source_title: str = ""
    source_reference: str = ""
    source_type: str = "official_document"

    chunk_index: int = 0
    content: str

    content_origin: str = "official_source"
    requires_validation: bool = True

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))