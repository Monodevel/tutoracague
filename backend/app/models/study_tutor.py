from pydantic import BaseModel


class StudyTutorRequest(BaseModel):
    topic_id: int
    action: str = "explain_concept"
    user_message: str = ""
    level: str = "basic"


class StudyTutorSource(BaseModel):
    title: str
    source_reference: str
    source_fragment: str


class StudyTutorResponse(BaseModel):
    answer: str
    topic_id: int
    topic_name: str
    action: str
    source_used: list[StudyTutorSource]
    suggested_actions: list[str]
    requires_validation: bool = False