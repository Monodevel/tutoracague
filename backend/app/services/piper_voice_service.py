import hashlib
import subprocess
from pathlib import Path

from app.services.voice_config import (
    PIPER_EXECUTABLE,
    VOICE_CACHE_DIR,
    VOICE_DIR,
    VOICE_MODEL_PATH,
)


class PiperVoiceService:
    def __init__(self):
        VOICE_DIR.mkdir(parents=True, exist_ok=True)
        VOICE_CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def is_available(self) -> dict:
        return {
            "available": VOICE_MODEL_PATH.exists(),
            "engine": "piper",
            "executable": str(PIPER_EXECUTABLE),
            "voice_model": str(VOICE_MODEL_PATH),
            "voice_exists": VOICE_MODEL_PATH.exists(),
            "cache_dir": str(VOICE_CACHE_DIR),
        }

    def synthesize(self, text: str) -> Path:
        clean_text = self._clean_text(text)

        if not clean_text:
            raise ValueError("El texto para voz está vacío.")

        if not VOICE_MODEL_PATH.exists():
            raise FileNotFoundError(
                f"No se encontró el modelo de voz Piper: {VOICE_MODEL_PATH}"
            )

        output_path = self._get_output_path(clean_text)

        if output_path.exists():
            return output_path

        command = [
            str(PIPER_EXECUTABLE),
            "--model",
            str(VOICE_MODEL_PATH),
            "--output_file",
            str(output_path),
        ]

        process = subprocess.run(
            command,
            input=clean_text,
            text=True,
            capture_output=True,
            timeout=120,
            check=False,
        )

        if process.returncode != 0:
            raise RuntimeError(
                "Piper falló al generar el audio. "
                f"STDOUT: {process.stdout} STDERR: {process.stderr}"
            )

        if not output_path.exists():
            raise RuntimeError("Piper no generó el archivo de audio esperado.")

        return output_path

    def _get_output_path(self, text: str) -> Path:
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        return VOICE_CACHE_DIR / f"{digest}.wav"

    def _clean_text(self, text: str) -> str:
        return " ".join(text.replace("\n", " ").split()).strip()