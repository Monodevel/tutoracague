import { useEffect, useMemo, useState } from "react";
import { BookOpen, Database, Search, Sparkles } from "lucide-react";
import { apiGet } from "../api/client";
import type { StudyCatalogArea, StudyCatalogTopic } from "../api/types";
import {
  SectionHeader,
  StatusPill,
  TutorButton,
  TutorCard,
  TutorEmptyState,
} from "../components/ui";

interface StudyPageProps {
  onStartStudy: (topicId: number) => void;
}

export function StudyPage({ onStartStudy }: StudyPageProps) {
  const [areas, setAreas] = useState<StudyCatalogArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        setError("");

        const result = await apiGet<StudyCatalogArea[]>("/study/catalog");

        setAreas(result);

        const firstArea = result[0] ?? null;
        setSelectedAreaId(firstArea?.id ?? null);
        setSelectedTopicId(firstArea?.topics?.[0]?.id ?? null);
      } catch (ex) {
        if (ex instanceof Error) {
          setError(ex.message);
        } else {
          setError("No fue posible cargar los contenidos de estudio.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  const selectedArea =
    areas.find((area) => area.id === selectedAreaId) ?? areas[0] ?? null;

  const filteredTopics = useMemo(() => {
    const topics = selectedArea?.topics ?? [];
    const cleanSearch = search.trim().toLowerCase();

    if (!cleanSearch) return topics;

    return topics.filter((topic) => {
      return (
        topic.name.toLowerCase().includes(cleanSearch) ||
        topic.description.toLowerCase().includes(cleanSearch)
      );
    });
  }, [selectedArea, search]);

  const selectedTopic: StudyCatalogTopic | null =
    filteredTopics.find((topic) => topic.id === selectedTopicId) ??
    selectedArea?.topics.find((topic) => topic.id === selectedTopicId) ??
    filteredTopics[0] ??
    null;

  if (loading) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<BookOpen size={28} />}
          title="Cargando contenidos"
          description="Leyendo áreas, temas, lecciones y base RAG local."
        />
      </TutorCard>
    );
  }

  if (error) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<Database size={28} />}
          title="No fue posible cargar contenidos"
          description={error}
        />
      </TutorCard>
    );
  }

  if (!areas.length) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<Database size={28} />}
          title="Sin contenidos importados"
          description="No existen áreas de estudio cargadas. Importe un paquete TutorAcague antes de estudiar."
        />
      </TutorCard>
    );
  }

  return (
    <section className="grid h-full min-h-0 grid-cols-[300px_minmax(0,1fr)_340px] gap-4 overflow-hidden max-[1366px]:grid-cols-[260px_minmax(0,1fr)_300px]">
      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Áreas</h2>
          <p className="mt-1 text-sm text-slate-400">
            Contenidos importados al sistema.
          </p>
        </div>

        <div className="grid content-start gap-3 overflow-auto pr-1">
          {areas.map((area) => {
            const active = area.id === selectedAreaId;

            return (
              <button
                key={area.id}
                type="button"
                onClick={() => {
                  setSelectedAreaId(area.id);
                  setSelectedTopicId(area.topics[0]?.id ?? null);
                }}
                className={[
                  "rounded-2xl border p-4 text-left transition active:scale-[0.99]",
                  active
                    ? "border-cyan-300/40 bg-cyan-400/10"
                    : "border-slate-700/60 bg-slate-900/55 hover:border-slate-600",
                ].join(" ")}
              >
                <div className="font-black text-white">{area.name}</div>

                <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                  {area.description || "Sin descripción."}
                </div>

                <div className="mt-3">
                  <StatusPill tone="info">
                    {area.topics.length} tema
                    {area.topics.length === 1 ? "" : "s"}
                  </StatusPill>
                </div>
              </button>
            );
          })}
        </div>
      </TutorCard>

      <TutorCard className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-4 p-6">
        <SectionHeader
          kicker="Estudiar"
          icon={<Sparkles size={16} />}
          title={selectedArea?.name ?? "Contenidos"}
          description="Selecciona un tema para que TutorAcague lo explique dinámicamente usando el RAG local."
          action={
            <StatusPill tone="ok" icon={<Database size={15} />}>
              Catálogo local
            </StatusPill>
          }
        />

        <div className="grid grid-cols-[44px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/70 focus-within:border-cyan-300/50 focus-within:ring-2 focus:ring-cyan-300/10">
          <div className="grid place-items-center text-slate-500">
            <Search size={18} />
          </div>

          <input
            className="min-h-12 bg-transparent pr-4 text-sm text-white outline-none placeholder:text-slate-600"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar tema dentro del área seleccionada..."
          />
        </div>

        <div className="grid content-start gap-3 overflow-auto pr-1">
          {filteredTopics.map((topic) => {
            const active = selectedTopic?.id === topic.id;

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => setSelectedTopicId(topic.id)}
                className={[
                  "rounded-2xl border p-4 text-left transition active:scale-[0.99]",
                  active
                    ? "border-cyan-300/40 bg-cyan-400/10"
                    : "border-slate-700/60 bg-slate-900/55 hover:border-slate-600",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-black text-white">{topic.name}</div>

                    <div className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-400">
                      {topic.description || "Tema importado sin descripción."}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone={topic.has_content ? "ok" : "warn"}>
                      {topic.lessons_count} lección
                      {topic.lessons_count === 1 ? "" : "es"}
                    </StatusPill>

                    <StatusPill tone={topic.has_rag ? "info" : "warn"}>
                      {topic.rag_chunks_count} RAG
                    </StatusPill>
                  </div>
                </div>
              </button>
            );
          })}

          {!filteredTopics.length && (
            <TutorEmptyState
              icon={<BookOpen size={28} />}
              title="Sin temas"
              description="No se encontraron temas en esta área."
            />
          )}
        </div>
      </TutorCard>

      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Tema seleccionado</h2>
          <p className="mt-1 text-sm text-slate-400">
            TutorAcague usará el RAG local para enseñar este contenido.
          </p>
        </div>

        {selectedTopic ? (
          <div className="grid content-start gap-4 overflow-auto pr-1">
            <TutorCard className="bg-slate-900/55 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Tema
              </div>

              <div className="mt-2 text-xl font-black text-white">
                {selectedTopic.name}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                {selectedTopic.description || "Sin descripción disponible."}
              </p>
            </TutorCard>

            <div className="grid grid-cols-2 gap-3">
              <TutorCard className="bg-slate-900/55 p-4">
                <div className="text-2xl font-black text-white">
                  {selectedTopic.lessons_count}
                </div>
                <div className="mt-1 text-xs font-bold uppercase text-slate-500">
                  Lecciones
                </div>
              </TutorCard>

              <TutorCard className="bg-slate-900/55 p-4">
                <div className="text-2xl font-black text-white">
                  {selectedTopic.rag_chunks_count}
                </div>
                <div className="mt-1 text-xs font-bold uppercase text-slate-500">
                  Chunks RAG
                </div>
              </TutorCard>
            </div>

            {!selectedTopic.has_rag && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-100">
                Este tema tiene contenido, pero todavía no tiene RAG indexado.
                Reindexa el tema desde el backend antes de usar el tutor
                dinámico.
              </div>
            )}
          </div>
        ) : (
          <TutorEmptyState
            icon={<BookOpen size={28} />}
            title="Seleccione un tema"
            description="Elija un tema para iniciar el estudio dinámico."
          />
        )}

        <TutorButton
          variant="primary"
          full
          disabled={!selectedTopic || !selectedTopic.has_content}
          onClick={() => {
            if (selectedTopic) {
              onStartStudy(selectedTopic.id);
            }
          }}
        >
          <Sparkles size={18} />
          Iniciar tutor dinámico
        </TutorButton>
      </TutorCard>
    </section>
  );
}