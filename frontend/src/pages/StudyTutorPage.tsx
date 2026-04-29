import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  ChevronRight,
  GraduationCap,
  Layers,
  Lightbulb,
  MessageCircle,
  Mic,
  Search,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";
import { apiPost } from "../api/client";
import type { StudyTutorResponse } from "../api/types";
import { usePiperSpeech } from "../hooks/usePiperSpeech";
import {
  SectionHeader,
  StatusPill,
  TutorButton,
  TutorCard,
  TutorEmptyState,
} from "../components/ui";

interface StudyTutorPageProps {
  topicId: number;
  onBack: () => void;
  onPractice: () => void;
}

const ACTIONS = [
  {
    id: "explain_concept",
    label: "Explicar",
    description: "Clase principal",
    icon: BookOpen,
  },
  {
    id: "simplify",
    label: "Más simple",
    description: "Lenguaje claro",
    icon: Lightbulb,
  },
  {
    id: "deepen",
    label: "Profundizar",
    description: "Análisis mayor",
    icon: Brain,
  },
  {
    id: "give_applied_example",
    label: "Ejemplo",
    description: "Aplicación",
    icon: Sparkles,
  },
  {
    id: "compare",
    label: "Comparar",
    description: "Diferencias",
    icon: Layers,
  },
  {
    id: "prepare_oral_answer",
    label: "Respuesta oral",
    description: "Modelo",
    icon: Mic,
  },
];

function getActionLabel(actionId: string): string {
  const action = ACTIONS.find((item) => item.id === actionId);
  return action?.label ?? "Estudio";
}

export function StudyTutorPage({
  topicId,
  onBack,
  onPractice,
}: StudyTutorPageProps) {
  const [currentAction, setCurrentAction] = useState("explain_concept");
  const [response, setResponse] = useState<StudyTutorResponse | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  const { speak, stop, isSpeaking, isLoadingVoice, voiceError } =
    usePiperSpeech();

  async function askTutor(action: string, message = "") {
    try {
      setError("");

      if (isSpeaking) {
        stop();
      }

      if (!response) {
        setLoading(true);
      } else {
        setAsking(true);
      }

      setCurrentAction(action);

      const result = await apiPost<StudyTutorResponse>("/study-tutor/ask", {
        topic_id: topicId,
        action,
        user_message: message,
        level: "basic",
      });

      setResponse(result);
    } catch (ex) {
      if (ex instanceof Error) {
        setError(ex.message);
      } else {
        setError(
          "No fue posible generar la explicación. Verifique que el tema tenga contenido RAG y que Ollama esté funcionando."
        );
      }
    } finally {
      setLoading(false);
      setAsking(false);
    }
  }

  useEffect(() => {
    setResponse(null);
    setError("");
    setQuestion("");
    setCurrentAction("explain_concept");

    askTutor("explain_concept");

    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  async function handleCustomQuestion() {
    const message = question.trim();

    if (!message || asking) return;

    setQuestion("");
    await askTutor("clarify_confusion", message);
  }

  function handleSpeech() {
    if (isSpeaking) {
      stop();
      return;
    }

    const textToRead = response?.answer?.trim();

    if (!textToRead) {
      setError("No hay una explicación disponible para reproducir.");
      return;
    }

    speak(textToRead);
  }

  function handleBack() {
    stop();
    onBack();
  }

  function handlePractice() {
    stop();
    onPractice();
  }

  if (loading) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<GraduationCap size={28} />}
          title="Preparando tutor dinámico"
          description="TutorAcague está recuperando la documentación RAG y generando una explicación pedagógica."
        />
      </TutorCard>
    );
  }

  if (error && !response) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<MessageCircle size={28} />}
          title="No fue posible iniciar el estudio"
          description={error}
          action={
            <TutorButton variant="secondary" onClick={handleBack}>
              <ArrowLeft size={18} />
              Volver
            </TutorButton>
          }
        />
      </TutorCard>
    );
  }

  return (
    <section className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_340px] gap-4 overflow-hidden max-[1366px]:grid-cols-[minmax(0,1fr)_310px] max-[1366px]:gap-3">
      <TutorCard className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-5 p-6">
        <SectionHeader
          kicker="Estudio dinámico"
          icon={<GraduationCap size={16} />}
          title={response?.topic_name ?? "TutorAcague"}
          description="Aprende, aclara, simplifica, profundiza y relaciona la materia usando Ollama sobre el RAG local."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <TutorButton
                variant="secondary"
                onClick={handleSpeech}
                disabled={isLoadingVoice || !response?.answer}
              >
                {isSpeaking ? <Square size={18} /> : <Volume2 size={18} />}
                {isLoadingVoice
                  ? "Generando voz..."
                  : isSpeaking
                    ? "Detener"
                    : "Escuchar"}
              </TutorButton>

              <TutorButton variant="secondary" onClick={handleBack}>
                <ArrowLeft size={18} />
                Volver
              </TutorButton>
            </div>
          }
        />

        <div className="grid grid-cols-3 gap-3 max-[1366px]:grid-cols-2">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            const active = currentAction === action.id;

            return (
              <button
                key={action.id}
                type="button"
                onClick={() => askTutor(action.id)}
                disabled={asking || loading}
                className={[
                  "grid min-h-[78px] grid-cols-[42px_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                  active
                    ? "border-cyan-300/40 bg-cyan-400/10"
                    : "border-slate-700/60 bg-slate-900/55 hover:border-slate-600",
                  asking ? "cursor-wait opacity-70" : "",
                ].join(" ")}
              >
                <div
                  className={[
                    "grid h-10 w-10 place-items-center rounded-2xl border",
                    active
                      ? "border-cyan-300/30 bg-cyan-300 text-slate-950"
                      : "border-slate-700 bg-slate-950/60 text-slate-400",
                  ].join(" ")}
                >
                  <Icon size={18} />
                </div>

                <div className="min-w-0">
                  <strong className="block truncate text-sm font-black text-white">
                    {action.label}
                  </strong>
                  <span className="mt-1 block text-xs text-slate-400">
                    {action.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <TutorCard className="min-h-0 overflow-auto bg-slate-950/35 p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusPill tone="info" icon={<Sparkles size={15} />}>
              {asking
                ? "Generando explicación..."
                : getActionLabel(currentAction)}
            </StatusPill>

            {response?.requires_validation && (
              <StatusPill tone="warn">Requiere validación</StatusPill>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm leading-relaxed text-red-100">
              {error}
            </div>
          )}

          {voiceError && (
            <div className="mb-4 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm leading-relaxed text-red-100">
              {voiceError}
            </div>
          )}

          <article className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-base leading-8 text-slate-100 max-[1366px]:text-sm max-[1366px]:leading-7">
              {response?.answer ||
                "No hay explicación disponible para este tema."}
            </div>
          </article>
        </TutorCard>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
          <div className="grid grid-cols-[44px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/70 focus-within:border-cyan-300/50 focus-within:ring-2 focus-within:ring-cyan-300/10">
            <div className="grid place-items-center text-slate-500">
              <Search size={18} />
            </div>

            <input
              className="min-h-12 bg-transparent pr-4 text-sm text-white outline-none placeholder:text-slate-600"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Pregunta al tutor: no entiendo este concepto, dame otro ejemplo, compáralo con..."
              disabled={asking}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleCustomQuestion();
                }
              }}
            />
          </div>

          <TutorButton
            variant="primary"
            onClick={handleCustomQuestion}
            disabled={asking || !question.trim()}
          >
            Preguntar
            <ChevronRight size={18} />
          </TutorButton>
        </div>
      </TutorCard>

      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <BookOpen size={20} className="text-cyan-200" />
            Fuentes usadas
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            TutorAcague genera la explicación desde chunks RAG almacenados
            localmente.
          </p>
        </div>

        <div className="grid content-start gap-3 overflow-auto pr-1">
          {response?.source_used.map((source, index) => (
            <TutorCard
              key={`${source.title}-${source.source_reference}-${index}`}
              className="bg-slate-900/55 p-4"
            >
              <div className="text-sm font-black text-white">
                {source.title || "Fuente sin título"}
              </div>

              <div className="mt-1 text-xs leading-relaxed text-cyan-100">
                {source.source_reference || "Referencia local"}
              </div>

              <p className="mt-3 line-clamp-[8] text-xs leading-relaxed text-slate-400">
                {source.source_fragment || "Sin fragmento visible."}
              </p>
            </TutorCard>
          ))}

          {!response?.source_used.length && (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4 text-sm text-slate-400">
              No hay fuentes visibles asociadas. Verifique que el tema tenga
              chunks RAG indexados.
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <TutorButton variant="secondary" full onClick={handlePractice}>
            Practicar este tema
          </TutorButton>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-xs leading-relaxed text-cyan-100">
            Estudiar es para comprender. La práctica y evaluación quedan
            separadas.
          </div>
        </div>
      </TutorCard>
    </section>
  );
}