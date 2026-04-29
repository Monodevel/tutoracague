import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
  Target,
} from "lucide-react";
import type { ProgressSummary } from "../api/types";
import { apiGet } from "../api/client";
import {
  SectionHeader,
  StatusPill,
  TutorButton,
  TutorCard,
  TutorEmptyState,
} from "../components/ui";


const todayPlan = [
  {
    title: "Continuar sesión recomendada",
    description: "Retomar el último tema pendiente.",
    status: "Pendiente",
  },
  {
    title: "Realizar práctica breve",
    description: "Evaluar comprensión del contenido estudiado.",
    status: "Sugerido",
  },
  {
    title: "Revisar tema débil",
    description: "Reforzar el área con menor rendimiento reciente.",
    status: "Refuerzo",
  },
];

export function HomePage() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const result = await apiGet<ProgressSummary>("/results/summary");
        setSummary(result);
      } catch {
        setSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    }

    loadSummary();
  }, []);
  const lastResult = summary?.recent_results?.[0] ?? null;

  return (
    <section className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_360px] grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden max-[1366px]:grid-cols-[minmax(0,1fr)_320px] max-[1366px]:gap-3">
      <div className="col-span-2">
        <SectionHeader
          kicker="Inicio"
          icon={<ShieldCheck size={16} />}
          title="TutorAcague"
          description="Panel principal del dispositivo. Revisa el estado general, tu plan del día y el último resultado registrado."
        />
      </div>

      <main className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
        <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">Plan de hoy</h2>
              <p className="mt-1 text-sm text-slate-400">
                Acciones sugeridas para mantener continuidad de estudio.
              </p>
            </div>

            <StatusPill tone="info" icon={<CalendarCheck size={16} />}>
              {todayPlan.length} tareas
            </StatusPill>
          </div>

          <div className="grid content-start gap-3 overflow-auto pr-1">
            {todayPlan.map((item, index) => (
              <div
                key={item.title}
                className="grid min-h-[86px] grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-black text-cyan-200">
                  {(index + 1).toString().padStart(2, "0")}
                </div>

                <div className="min-w-0">
                  <strong className="block text-sm font-black text-white">
                    {item.title}
                  </strong>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-400">
                    {item.description}
                  </span>
                </div>

                <StatusPill tone={index === 0 ? "ok" : "default"}>
                  {item.status}
                </StatusPill>
              </div>
            ))}
          </div>
        </TutorCard>
      </main>

      <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
        <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">
                Última sesión
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Resultado más reciente registrado.
              </p>
            </div>

            <History size={22} className="text-cyan-200" />
          </div>

          {loadingSummary ? (
            <TutorEmptyState
              icon={<Clock size={26} />}
              title="Cargando resultado"
              description="Consultando el historial local."
            />
          ) : !lastResult ? (
            <TutorEmptyState
              icon={<Target size={26} />}
              title="Sin sesiones registradas"
              description="Cuando finalices una práctica, el último resultado aparecerá aquí."
            />
          ) : (
            <div className="grid content-start gap-4">
              <div className="grid place-items-center rounded-[26px] border border-cyan-400/20 bg-cyan-400/10 p-6">
                <div className="text-6xl font-black leading-none text-white">
                  {lastResult.score_percentage}%
                </div>
                <div className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
                  Puntaje
                </div>
              </div>

              <div className="grid gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Tema
                  </div>
                  <div className="mt-1 text-base font-black text-white">
                    {lastResult.topic_name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <div className="flex items-center gap-2 text-emerald-200">
                      <CheckCircle2 size={18} />
                      <span className="text-xs font-black uppercase">
                        Correctas
                      </span>
                    </div>
                    <div className="mt-2 text-2xl font-black text-white">
                      {lastResult.correct_answers}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4">
                    <div className="text-xs font-black uppercase text-slate-400">
                      Total
                    </div>
                    <div className="mt-2 text-2xl font-black text-white">
                      {lastResult.total_questions}
                    </div>
                  </div>
                </div>

                <div className="text-xs leading-relaxed text-slate-500">
                  {new Date(lastResult.created_at).toLocaleString()}
                </div>
              </div>

              <TutorButton variant="secondary" full>
                Ver progreso
              </TutorButton>
            </div>
          )}
        </TutorCard>
      </aside>
    </section>
  );
}