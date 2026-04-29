from datetime import date
from typing import Optional

from pydantic import BaseModel
from sqlmodel import SQLModel, Field


class UserProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    full_name: str
    birth_date: date
    email: str
    initial_setup_completed: bool = False

    daily_study_minutes: int = 45
    preferred_study_time: str = "20:00"
    voice_enabled: bool = True
    voice_mode: str = "piper"
    notifications_enabled: bool = True
    offline_mode: bool = True
    study_mode: str = "guided"


class UserProfileCreate(BaseModel):
    full_name: str
    birth_date: date
    email: str
    initial_setup_completed: bool = True

    daily_study_minutes: int = 45
    preferred_study_time: str = "20:00"
    voice_enabled: bool = True
    voice_mode: str = "piper"
    notifications_enabled: bool = True
    offline_mode: bool = True
    study_mode: str = "guided"


class UserProfileRead(BaseModel):
    id: int
    full_name: str
    birth_date: date
    email: str
    initial_setup_completed: bool

    daily_study_minutes: int
    preferred_study_time: str
    voice_enabled: bool
    voice_mode: str
    notifications_enabled: bool
    offline_mode: bool
    study_mode: str