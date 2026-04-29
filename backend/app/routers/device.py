from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/api/device", tags=["device"])


@router.get("/status")
def get_device_status():
    now = datetime.now()

    return {
        "online": False,
        "wifi": "Offline",
        "bluetooth": {
            "available": False,
            "connected": False,
            "device_name": None,
        },
        "audio": {
            "available": True,
            "active_device": "Audio local",
        },
        "ai": {
            "available": True,
            "status": "IA local lista",
        },
        "license": {
            "status": "valid",
            "label": "Licencia válida",
        },
        "time": now.strftime("%H:%M:%S"),
        "date": now.strftime("%d-%m-%Y"),
        "day_name": now.strftime("%A"),
        "update": {
            "installed_version": "2026.001",
            "installed_label": "Base ACAGUE 2026.001",
            "installed_at": "2026-04-27",
            "status": "updated",
        },
    }