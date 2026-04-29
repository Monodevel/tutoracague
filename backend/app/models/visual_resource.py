from typing import Optional

from pydantic import BaseModel


class MapLayerRead(BaseModel):
    id: str
    name: str
    type: str = "image_overlay"
    file_url: Optional[str] = None
    default_visible: bool = False
    opacity: float = 1.0


class MapMarkerRead(BaseModel):
    id: str
    label: str
    x: float
    y: float
    description: str = ""


class VisualResourceRead(BaseModel):
    id: str
    topic_id: int
    title: str
    description: str
    type: str = "layered_map"
    base_image_url: str
    source: str
    source_reference: str
    layers: list[MapLayerRead]
    markers: list[MapMarkerRead]