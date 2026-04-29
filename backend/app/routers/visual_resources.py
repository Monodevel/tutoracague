from fastapi import APIRouter, HTTPException

from app.models.visual_resource import (
    MapLayerRead,
    MapMarkerRead,
    VisualResourceRead,
)

router = APIRouter(prefix="/api/visual-resources", tags=["visual-resources"])


@router.get("/topic/{topic_id}", response_model=list[VisualResourceRead])
def get_visual_resources_by_topic(topic_id: int):
    """
    Primera versión:
    Devuelve recursos visuales de prueba para validar el visor de mapas.

    Más adelante esto leerá desde:
    - base de datos
    - paquete TAUP
    - manifest visual
    - carpeta storage/maps
    """

    if topic_id != 1:
        return []

    return [
        VisualResourceRead(
            id="geo_demo_001",
            topic_id=topic_id,
            title="Mapa de estudio demostrativo",
            description=(
                "Mapa por capas para validar estudio visual, límites, nombres "
                "y marcadores geográficos."
            ),
            type="layered_map",
            base_image_url="/static/maps/demo/base.svg",
            source="Recurso visual de prueba TutorAcague",
            source_reference="Demo local",
            layers=[
                MapLayerRead(
                    id="limites",
                    name="Límites",
                    type="image_overlay",
                    file_url="/static/maps/demo/limites.svg",
                    default_visible=True,
                    opacity=0.9,
                ),
                MapLayerRead(
                    id="nombres",
                    name="Nombres",
                    type="image_overlay",
                    file_url="/static/maps/demo/nombres.svg",
                    default_visible=False,
                    opacity=1,
                ),
                MapLayerRead(
                    id="rutas",
                    name="Rutas",
                    type="image_overlay",
                    file_url="/static/maps/demo/rutas.svg",
                    default_visible=False,
                    opacity=0.9,
                ),
            ],
            markers=[
                MapMarkerRead(
                    id="punto_1",
                    label="Punto A",
                    x=42,
                    y=38,
                    description="Marcador demostrativo para análisis territorial.",
                ),
                MapMarkerRead(
                    id="punto_2",
                    label="Punto B",
                    x=68,
                    y=62,
                    description="Segundo punto clave para comparar ubicación y relación.",
                ),
            ],
        )
    ]


@router.get("/{resource_id}", response_model=VisualResourceRead)
def get_visual_resource(resource_id: str):
    resources = get_visual_resources_by_topic(1)

    for resource in resources:
      if resource.id == resource_id:
          return resource

    raise HTTPException(status_code=404, detail="Recurso visual no encontrado.")