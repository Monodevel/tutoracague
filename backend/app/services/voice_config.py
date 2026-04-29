import os
import shutil
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]

# Desarrollo en Mac/Windows:
DEFAULT_STORAGE_DIR = BASE_DIR / "storage"

# Producción en Debian:
PRODUCTION_STORAGE_DIR = Path("/var/lib/tutoracague")

# Si existe /var/lib/tutoracague, usamos modo producción.
# Si no existe, usamos backend/storage.
if PRODUCTION_STORAGE_DIR.exists():
    STORAGE_DIR = PRODUCTION_STORAGE_DIR
else:
    STORAGE_DIR = DEFAULT_STORAGE_DIR


VOICE_DIR = STORAGE_DIR / "voices"
VOICE_CACHE_DIR = STORAGE_DIR / "voice_cache"

# Puedes cambiar este nombre según la voz que descargues.
VOICE_MODEL_NAME = os.getenv(
    "TUTORACAGUE_PIPER_VOICE",
    "es_MX-claude-high.onnx",
)

VOICE_MODEL_PATH = VOICE_DIR / VOICE_MODEL_NAME

# Busca piper en el entorno virtual o en el PATH del sistema.
PIPER_EXECUTABLE = (
    os.getenv("TUTORACAGUE_PIPER_EXECUTABLE")
    or shutil.which("piper")
    or "piper"
)