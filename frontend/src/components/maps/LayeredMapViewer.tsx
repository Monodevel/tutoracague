import { useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Flag,
  Layers,
  MapPinned,
  Maximize2,
  MousePointer2,
} from "lucide-react";
import type { VisualResource } from "../../api/types";
import {
  StatusPill,
  TutorButton,
  TutorCard,
  TutorProgressBar,
} from "../ui";

interface LayeredMapViewerProps {
  resource: VisualResource;
}

function resolveUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `http://127.0.0.1:8000${url}`;
}

export function LayeredMapViewer({ resource }: LayeredMapViewerProps) {
  const defaultVisibleLayers = useMemo(() => {
    return new Set(
      resource.layers
        .filter((layer) => layer.default_visible)
        .map((layer) => layer.id)
    );
  }, [resource.layers]);

  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    defaultVisibleLayers
  );

  const [showMarkers, setShowMarkers] = useState(true);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [evaluationMode, setEvaluationMode] = useState(false);

  const selectedMarker =
    resource.markers.find((marker) => marker.id === selectedMarkerId) ?? null;

  const activeLayersCount = visibleLayers.size + (showMarkers ? 1 : 0);
  const totalVisualItems = resource.layers.length + 1;
  const activePercent = Math.round((activeLayersCount / totalVisualItems) * 100);

  function toggleLayer(layerId: string) {
    setVisibleLayers((current) => {
      const next = new Set(current);

      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }

      return next;
    });
  }

  function resetLayers() {
    setVisibleLayers(defaultVisibleLayers);
    setShowMarkers(true);
    setSelectedMarkerId(null);
    setEvaluationMode(false);
  }

  return (
    <section className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_320px] gap-4 overflow-hidden max-[1366px]:grid-cols-[minmax(0,1fr)_290px] max-[1366px]:gap-3">
      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusPill tone="info" icon={<MapPinned size={15} />}>
                Mapa por capas
              </StatusPill>

              {evaluationMode && (
                <StatusPill tone="warn" icon={<MousePointer2 size={15} />}>
                  Evaluación visual
                </StatusPill>
              )}
            </div>

            <h2 className="truncate text-2xl font-black text-white">
              {resource.title}
            </h2>

            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
              {resource.description}
            </p>
          </div>

          <TutorButton variant="secondary">
            <Maximize2 size={18} />
            Ampliar
          </TutorButton>
        </div>

        <div className="relative min-h-0 overflow-hidden rounded-[28px] border border-slate-700/60 bg-slate-950">
          <img
            src={resolveUrl(resource.base_image_url)}
            className="absolute inset-0 h-full w-full object-contain"
            alt={resource.title}
            draggable={false}
          />

          {resource.layers.map((layer) => {
            if (!layer.file_url || !visibleLayers.has(layer.id)) return null;

            return (
              <img
                key={layer.id}
                src={resolveUrl(layer.file_url)}
                className="absolute inset-0 h-full w-full object-contain"
                style={{ opacity: layer.opacity }}
                alt={layer.name}
                draggable={false}
              />
            );
          })}

          {showMarkers &&
            resource.markers.map((marker) => {
              const selected = selectedMarkerId === marker.id;

              return (
                <button
                  key={marker.id}
                  type="button"
                  className={[
                    "absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border shadow-xl transition active:scale-95",
                    selected
                      ? "border-cyan-200 bg-cyan-300 text-slate-950"
                      : "border-yellow-300/50 bg-yellow-300/90 text-slate-950 hover:bg-yellow-200",
                  ].join(" ")}
                  style={{
                    left: `${marker.x}%`,
                    top: `${marker.y}%`,
                  }}
                  onClick={() =>
                    setSelectedMarkerId(selected ? null : marker.id)
                  }
                  title={marker.label}
                >
                  <Flag size={18} />
                </button>
              );
            })}

          {evaluationMode && (
            <div className="absolute left-4 top-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100 backdrop-blur">
              Oculta/activa capas y responde según el mapa.
            </div>
          )}
        </div>
      </TutorCard>

      <TutorCard className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <Layers size={20} className="text-cyan-200" />
            Capas del mapa
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Activa o desactiva información visual.
          </p>
        </div>

        <TutorProgressBar value={activePercent} label="Elementos visibles" />

        <div className="grid min-h-0 content-start gap-3 overflow-auto pr-1">
          {resource.layers.map((layer) => {
            const active = visibleLayers.has(layer.id);

            return (
              <button
                key={layer.id}
                type="button"
                className={[
                  "grid min-h-[70px] grid-cols-[42px_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                  active
                    ? "border-cyan-300/40 bg-cyan-400/10"
                    : "border-slate-700/60 bg-slate-900/55",
                ].join(" ")}
                onClick={() => toggleLayer(layer.id)}
              >
                <div
                  className={[
                    "grid h-10 w-10 place-items-center rounded-2xl border",
                    active
                      ? "border-cyan-300/30 bg-cyan-300 text-slate-950"
                      : "border-slate-700 bg-slate-950/60 text-slate-500",
                  ].join(" ")}
                >
                  {active ? <Eye size={18} /> : <EyeOff size={18} />}
                </div>

                <div className="min-w-0">
                  <strong className="block truncate text-sm font-black text-white">
                    {layer.name}
                  </strong>
                  <span className="mt-1 block text-xs text-slate-400">
                    Opacidad {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            className={[
              "grid min-h-[70px] grid-cols-[42px_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
              showMarkers
                ? "border-yellow-300/40 bg-yellow-300/10"
                : "border-slate-700/60 bg-slate-900/55",
            ].join(" ")}
            onClick={() => setShowMarkers((value) => !value)}
          >
            <div
              className={[
                "grid h-10 w-10 place-items-center rounded-2xl border",
                showMarkers
                  ? "border-yellow-300/30 bg-yellow-300 text-slate-950"
                  : "border-slate-700 bg-slate-950/60 text-slate-500",
              ].join(" ")}
            >
              <Flag size={18} />
            </div>

            <div className="min-w-0">
              <strong className="block truncate text-sm font-black text-white">
                Marcadores
              </strong>
              <span className="mt-1 block text-xs text-slate-400">
                {resource.markers.length} puntos clave
              </span>
            </div>
          </button>

          {selectedMarker && (
            <TutorCard className="border-yellow-300/20 bg-yellow-300/10 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-yellow-200">
                Marcador seleccionado
              </div>

              <div className="mt-2 text-lg font-black text-white">
                {selectedMarker.label}
              </div>

              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {selectedMarker.description}
              </p>
            </TutorCard>
          )}

          <TutorCard className="bg-slate-900/55 p-4">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Fuente
            </div>

            <div className="mt-2 text-sm font-black text-white">
              {resource.source}
            </div>

            <div className="mt-1 text-xs leading-relaxed text-slate-400">
              {resource.source_reference}
            </div>
          </TutorCard>
        </div>

        <div className="grid gap-2">
          <TutorButton
            variant={evaluationMode ? "primary" : "secondary"}
            full
            onClick={() => setEvaluationMode((value) => !value)}
          >
            <MousePointer2 size={18} />
            {evaluationMode ? "Modo evaluación activo" : "Activar evaluación"}
          </TutorButton>

          <TutorButton variant="ghost" full onClick={resetLayers}>
            Restablecer capas
          </TutorButton>
        </div>
      </TutorCard>
    </section>
  );
}