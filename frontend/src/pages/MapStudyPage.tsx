import { useEffect, useState } from "react";
import { MapPinned } from "lucide-react";
import { apiGet } from "../api/client";
import type { VisualResource } from "../api/types";
import {
  SectionHeader,
  StatusPill,
  TutorCard,
  TutorEmptyState,
} from "../components/ui";
import { LayeredMapViewer } from "../components/maps/LayeredMapViewer";

interface MapStudyPageProps {
  topicId?: number;
}

export function MapStudyPage({ topicId = 1 }: MapStudyPageProps) {
  const [resources, setResources] = useState<VisualResource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResources() {
      try {
        const result = await apiGet<VisualResource[]>(
          `/visual-resources/topic/${topicId}`
        );

        setResources(result);

        if (result.length > 0) {
          setSelectedResourceId(result[0].id);
        }
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, [topicId]);

  const selectedResource =
    resources.find((resource) => resource.id === selectedResourceId) ?? null;

  if (loading) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<MapPinned size={28} />}
          title="Cargando recursos visuales"
          description="Preparando mapas, capas y marcadores disponibles."
        />
      </TutorCard>
    );
  }

  if (!selectedResource) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<MapPinned size={28} />}
          title="Sin recursos visuales"
          description="Este tema aún no tiene mapas o imágenes por capas asociados."
        />
      </TutorCard>
    );
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
      <SectionHeader
        kicker="Estudio visual"
        icon={<MapPinned size={16} />}
        title="Mapas y recursos gráficos"
        description="Analiza mapas, imágenes y capas superpuestas para estudiar información geográfica, límites, nombres, rutas y puntos clave."
        action={
          <StatusPill tone="info">
            {resources.length} recurso{resources.length === 1 ? "" : "s"}
          </StatusPill>
        }
      />

      <LayeredMapViewer resource={selectedResource} />
    </section>
  );
}