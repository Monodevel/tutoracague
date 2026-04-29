from pydantic import BaseModel


class VoiceSpeakRequest(BaseModel):
    text: str


class VoiceSpeakResponse(BaseModel):
    audio_url: str