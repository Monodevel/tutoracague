from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models.profile import UserProfile, UserProfileCreate, UserProfileRead

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=UserProfileRead | None)
def get_profile(session: Session = Depends(get_session)):
    profile = session.exec(select(UserProfile)).first()
    return profile


@router.post("", response_model=UserProfileRead)
def save_profile(
    payload: UserProfileCreate,
    session: Session = Depends(get_session),
):
    existing = session.exec(select(UserProfile)).first()

    if existing:
        existing.full_name = payload.full_name
        existing.birth_date = payload.birth_date
        existing.email = payload.email
        existing.initial_setup_completed = payload.initial_setup_completed

        existing.daily_study_minutes = payload.daily_study_minutes
        existing.preferred_study_time = payload.preferred_study_time
        existing.voice_enabled = payload.voice_enabled
        existing.voice_mode = payload.voice_mode
        existing.notifications_enabled = payload.notifications_enabled
        existing.offline_mode = payload.offline_mode
        existing.study_mode = payload.study_mode

        session.add(existing)
        session.commit()
        session.refresh(existing)

        return existing

    profile = UserProfile(
        full_name=payload.full_name,
        birth_date=payload.birth_date,
        email=payload.email,
        initial_setup_completed=payload.initial_setup_completed,
        daily_study_minutes=payload.daily_study_minutes,
        preferred_study_time=payload.preferred_study_time,
        voice_enabled=payload.voice_enabled,
        voice_mode=payload.voice_mode,
        notifications_enabled=payload.notifications_enabled,
        offline_mode=payload.offline_mode,
        study_mode=payload.study_mode,
    )

    session.add(profile)
    session.commit()
    session.refresh(profile)

    return profile