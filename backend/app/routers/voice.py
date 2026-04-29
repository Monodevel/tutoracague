from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.models.voice import VoiceSpeakRequest, VoiceSpeakResponse
from app.services.piper_voice_service import PiperVoiceService
from app.services.voice_config import VOICE_CACHE_DIR

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.get("/status")
def voice_status():
    service = PiperVoiceService()
    return service.is_available()


@router.post("/speak", response_model=VoiceSpeakResponse)
def speak(payload: VoiceSpeakRequest):
    try:
        service = PiperVoiceService()
        audio_path = service.synthesize(payload.text)

        return VoiceSpeakResponse(
            audio_url=f"/api/voice/audio/{audio_path.name}"
        )
    except Exception as ex:
        raise HTTPException(
            status_code=500,
            detail=f"No fue posible generar voz con Piper: {str(ex)}",
        )


@router.get("/audio/{file_name}")
def get_audio(file_name: str):
    audio_path = VOICE_CACHE_DIR / file_name

    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio no encontrado.")

    return FileResponse(
        audio_path,
        media_type="audio/wav",
        filename=file_name,
    )