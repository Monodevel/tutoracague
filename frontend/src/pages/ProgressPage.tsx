import { useEffect, useState } from "react";
import {
  BarChart3,
  History,
  Target,
  Trophy,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { apiGet } from "../api/client";
import type { ProgressSummary } from "../api/types";
import {
  SectionHeader,
  StatusPill,
  TutorCard,
  TutorEmptyState,
  TutorKpiCard,
} from "../components/ui";

export function ProgressPage() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const result = await apiGet<ProgressSummary>("/results/summary");
        setSummary(result);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  if (loading) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<BarChart3 size={28} />}
          title="Cargando progreso"
          description="Analizando resultados registrados en la base local."
        />
      </TutorCard>
    );
  }

  if (!summary || summary.total_sessions === 0) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<Target size={28} />}
          title="Aún no hay resultados"
          description="Realiza una práctica para que TutorAcague comience a registrar tu avance."
        />
      </TutorCard>
    );
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4 overflow-hidden">
      <SectionHeader
        kicker="Seguimiento del postulante"
        icon={<BarChart3 size={16} />}
        title="Progreso"
        description="Resumen de desempeño construido desde las prácticas realizadas, puntajes obtenidos y temas que requieren refuerzo."
        action={
          <StatusPill tone="info" icon={<TrendingUp size={16} />}>
            {summary.total_sessions} sesiones
          </StatusPill>
        }
      />

      <div className="grid grid-cols-4 gap-4 max-[1366px]:gap-3">
        <TutorKpiCard
          icon={<Clock size={22} />}
          value={summary.total_sessions}
          label="Sesiones"
          description="Prácticas realizadas"
        />

        <TutorKpiCard
          icon={<BarChart3 size={22} />}
          value={`${summary.average_score}%`}
          label="Promedio"
          description="Rendimiento general"
        />

        <TutorKpiCard
          icon={<Trophy size={22} />}
          value={`${summary.best_score}%`}
          label="Mejor"
          description="Mayor puntaje"
        />

        <TutorKpiCard
          icon={<CheckCircle2 size={22} />}
          value={`${summary.last_score}%`}
          label="Último"
          description="Última práctica"
        />
      </div>

      <div className="grid min-h-0 grid-cols-2 gap-4 overflow-hidden max-[1366px]:gap-3">
        <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black text-white">
                <Target size={20} className="text-cyan-200" />
                Temas a reforzar
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Ordenados por menor promedio.
              </p>
            </div>

            <StatusPill tone="warn">prioridad</StatusPill>
          </div>

          {summary.weakest_topics.length === 0 ? (
            <TutorEmptyState
              icon={<Target size={26} />}
              title="Sin temas débiles"
              description="Aún no hay información suficiente para detectar áreas de refuerzo."
            />
          ) : (
            <div className="grid min-h-0 content-start gap-3 overflow-auto pr-1">
              {summary.weakest_topics.map((topic) => (
                <div
                  key={topic.topic_id}
                  className="grid min-h-[82px] grid-cols-[minmax(0,1fr)_76px] items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4"
                >
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-black text-white">
                      {topic.topic_name}
                    </strong>

                    <span className="mt-1 block text-xs text-slate-400">
                      {topic.sessions} sesiones registradas
                    </span>
                  </div>

                  <div className="grid h-12 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-black text-cyan-200">
                    {topic.average_score}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </TutorCard>

        <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black text-white">
                <History size={20} className="text-cyan-200" />
                Historial reciente
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Últimos resultados registrados.
              </p>
            </div>

            <StatusPill tone="info">reciente</StatusPill>
          </div>

          {summary.recent_results.length === 0 ? (
            <TutorEmptyState
              icon={<History size={26} />}
              title="Sin historial"
              description="Los resultados aparecerán después de finalizar prácticas."
            />
          ) : (
            <div className="grid min-h-0 content-start gap-3 overflow-auto pr-1">
              {summary.recent_results.map((item) => (
                <div
                  key={item.id}
                  className="grid min-h-[82px] grid-cols-[minmax(0,1fr)_76px] items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4"
                >
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-black text-white">
                      {item.topic_name}
                    </strong>

                    <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                      {new Date(item.created_at).toLocaleString()} ·{" "}
                      {item.correct_answers}/{item.total_questions} correctas
                    </span>
                  </div>

                  <div className="grid h-12 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-black text-cyan-200">
                    {item.score_percentage}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </TutorCard>
      </div>

      <TutorCard className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <Trophy size={20} className="text-cyan-200" />
              Recomendación del tutor
            </h2>

            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-300">
              Prioriza el repaso de los temas con menor promedio y realiza una
              nueva práctica después de estudiar la lección correspondiente.
              TutorAcague irá ajustando las recomendaciones a medida que
              acumules más sesiones.
            </p>
          </div>

          <StatusPill tone="ok">automática</StatusPill>
        </div>
      </TutorCard>
    </section>
  );
}