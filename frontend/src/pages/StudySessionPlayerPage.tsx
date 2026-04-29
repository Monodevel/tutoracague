import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  Square,
  Target,
  Volume2,
  XCircle,
} from "lucide-react";
import { apiPost } from "../api/client";
import type {
  StudySessionAnswerResponse,
  StudySessionNextResponse,
  StudySessionStartResponse,
  StudySessionStep,
} from "../api/types";
import { usePiperSpeech } from "../hooks/usePiperSpeech";
import {
  SectionHeader,
  StatusPill,
  TutorButton,
  TutorCard,
  TutorEmptyState,
  TutorProgressBar,
} from "../components/ui";

interface StudySessionPlayerPageProps {
  topicId: number;
  durationMinutes?: number;
  onBack: () => void;
  onPractice: () => void;
}

function getPhaseLabel(phase: string): string {
  if (phase === "opening") return "Inicio";
  if (phase === "teaching") return "Enseñanza";
  if (phase === "simplification") return "En simple";
  if (phase === "key_concepts") return "Conceptos clave";
  if (phase === "analysis") return "Análisis";
  if (phase === "deepening") return "Profundización";
  if (phase === "relationships") return "Relaciones";
  if (phase === "common_errors") return "Errores comunes";
  if (phase === "visual_analysis") return "Análisis visual";
  if (phase === "closing") return "Cierre";
  return "Estudio";
}

export function StudySessionPlayerPage({
  topicId,
  durationMinutes = 45,
  onBack,
  onPractice,
}: StudySessionPlayerPageProps) {
  const [session, setSession] = useState<StudySessionStartResponse | null>(
    null
  );
  const [currentStep, setCurrentStep] = useState<StudySessionStep | null>(null);

  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<StudySessionAnswerResponse | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [movingNext, setMovingNext] = useState(false);
  const [error, setError] = useState("");

  const { speak, stop, isSpeaking, isLoadingVoice, voiceError } =
    usePiperSpeech();

  useEffect(() => {
    async function startSession() {
      try {
        setLoading(true);
        setError("");

        const result = await apiPost<StudySessionStartResponse>(
          "/study-session/start",
          {
            topic_id: topicId,
            duration_minutes: durationMinutes,
          }
        );

        setSession(result);
        setCurrentStep(result.step);
      } catch {
        setError(
          "No fue posible iniciar la sesión. Verifique que el tema tenga lecciones cargadas."
        );
      } finally {
        setLoading(false);
      }
    }

    startSession();

    return () => {
      stop();
    };
  }, [topicId, durationMinutes, stop]);

  const progress =
    session && currentStep
      ? Math.round((currentStep.order / session.total_steps) * 100)
      : 0;

  function getSpeechText() {
    if (!currentStep) return "";

    const parts = [
      currentStep.title,
      currentStep.tutor_message,
      currentStep.question ? `Pregunta: ${currentStep.question}` : "",
    ];

    return parts.filter(Boolean).join(". ");
  }

  function handleSpeech() {
    if (isSpeaking) {
      stop();
      return;
    }

    speak(getSpeechText());
  }

  async function submitAnswer() {
    if (!session || !currentStep || !answer.trim()) return;

    try {
      setSendingAnswer(true);
      setError("");

      const result = await apiPost<StudySessionAnswerResponse>(
        "/study-session/answer",
        {
          session_id: session.session_id,
          step_id: currentStep.id,
          answer,
        }
      );

      setFeedback(result);
    } catch {
      setError("No fue posible revisar la respuesta.");
    } finally {
      setSendingAnswer(false);
    }
  }

  async function nextStep() {
    if (!session) return;

    try {
      stop();
      setMovingNext(true);
      setError("");
      setAnswer("");
      setFeedback(null);

      const result = await apiPost<StudySessionNextResponse>(
        "/study-session/next",
        {
          session_id: session.session_id,
        }
      );

      if (result.finished || !result.step) {
        onPractice();
        return;
      }

      setCurrentStep(result.step);
      setSession((previous) =>
        previous
          ? {
              ...previous,
              current_step_index: result.current_step_index,
              total_steps: result.total_steps,
              step: result.step as StudySessionStep,
            }
          : previous
      );
    } catch {
      setError("No fue posible avanzar al siguiente paso.");
    } finally {
      setMovingNext(false);
    }
  }

  function handleBack() {
    stop();
    onBack();
  }

  if (loading) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<BookOpen size={28} />}
          title="Preparando sesión"
          description="TutorAcague está construyendo la sesión integral de estudio."
        />
      </TutorCard>
    );
  }

  if (error && !session) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<XCircle size={28} />}
          title="No se pudo iniciar la sesión"
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

  if (!session || !currentStep) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<BookOpen size={28} />}
          title="Sesión no disponible"
          description="No se pudo cargar la sesión solicitada."
        />
      </TutorCard>
    );
  }

  return (
    <section className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_340px] gap-4 overflow-hidden max-[1366px]:grid-cols-[minmax(0,1fr)_310px] max-[1366px]:gap-3">
      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5 p-6">
        <SectionHeader
          kicker="Sesión integral TutorAcague"
          icon={<ShieldCheck size={16} />}
          title={session.topic_name}
          description={`${durationMinutes} minutos · ${session.lesson_title ?? "Contenido local"}`}
          action={
            <TutorButton variant="secondary" onClick={handleBack}>
              <ArrowLeft size={18} />
              Volver
            </TutorButton>
          }
        />

        <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 overflow-hidden bg-slate-950/35 p-5">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusPill tone="info">
                Paso {currentStep.order} de {session.total_steps}
              </StatusPill>

              <StatusPill tone="default">
                {getPhaseLabel(currentStep.phase)}
              </StatusPill>
            </div>

            <TutorProgressBar value={progress} />
          </div>

          <div className="min-h-0 overflow-auto pr-1">
            <h2 className="text-3xl font-black leading-tight text-white max-[1366px]:text-2xl">
              {currentStep.title}
            </h2>

            <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-slate-200 max-[1366px]:text-sm">
              {currentStep.tutor_message}
            </p>

            {currentStep.requires_response && (
              <TutorCard className="mt-6 grid gap-4 bg-slate-900/55 p-5">
                <div className="flex items-start gap-3">
                  <MessageCircle size={22} className="mt-0.5 text-cyan-200" />
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                      Pregunta del tutor
                    </div>
                    <div className="mt-2 text-lg font-black leading-relaxed text-white">
                      {currentStep.question}
                    </div>
                  </div>
                </div>

                <textarea
                  className="min-h-36 w-full resize-y rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 text-sm leading-relaxed text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Responde con fundamento. Evita respuestas vagas o demasiado generales..."
                  disabled={feedback !== null}
                />

                {!feedback && (
                  <div className="flex justify-end">
                    <TutorButton
                      variant="primary"
                      onClick={submitAnswer}
                      disabled={sendingAnswer || !answer.trim()}
                    >
                      <CheckCircle2 size={18} />
                      {sendingAnswer ? "Revisando..." : "Revisar respuesta"}
                    </TutorButton>
                  </div>
                )}

                {feedback && (
                  <div
                    className={[
                      "rounded-2xl border p-4",
                      feedback.is_acceptable
                        ? "border-emerald-400/25 bg-emerald-400/10"
                        : "border-amber-400/25 bg-amber-400/10",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      {feedback.is_acceptable ? (
                        <CheckCircle2
                          size={22}
                          className="mt-0.5 text-emerald-200"
                        />
                      ) : (
                        <XCircle
                          size={22}
                          className="mt-0.5 text-amber-200"
                        />
                      )}

                      <div>
                        <h3 className="text-base font-black text-white">
                          {feedback.is_acceptable
                            ? "Respuesta aceptable"
                            : "Respuesta insuficiente"}
                        </h3>

                        <p className="mt-2 text-sm leading-relaxed text-slate-200">
                          {feedback.feedback}
                        </p>

                        {feedback.follow_up_question && (
                          <p className="mt-3 text-sm font-semibold leading-relaxed text-cyan-100">
                            {feedback.follow_up_question}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-3">
                      <ScoreBox
                        label="Concepto"
                        value={feedback.conceptual_accuracy}
                      />
                      <ScoreBox label="Profundidad" value={feedback.depth} />
                      <ScoreBox
                        label="Fuente"
                        value={feedback.source_alignment}
                      />
                      <ScoreBox label="Claridad" value={feedback.clarity} />
                    </div>
                  </div>
                )}
              </TutorCard>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
                {error}
              </div>
            )}

            {voiceError && (
              <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
                {voiceError}
              </div>
            )}
          </div>
        </TutorCard>

        <div className="flex flex-wrap justify-end gap-3">
          <TutorButton
            variant="secondary"
            onClick={handleSpeech}
            disabled={isLoadingVoice}
          >
            {isSpeaking ? <Square size={18} /> : <Volume2 size={18} />}
            {isLoadingVoice
              ? "Generando voz..."
              : isSpeaking
                ? "Detener voz"
                : "Escuchar"}
          </TutorButton>

          <TutorButton
            variant="primary"
            onClick={nextStep}
            disabled={movingNext}
          >
            {movingNext ? "Avanzando..." : "Continuar estudio"}
            <ChevronRight size={18} />
          </TutorButton>
        </div>
      </TutorCard>

      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Progreso de sesión</h2>
          <p className="mt-1 text-sm text-slate-400">
            TutorAcague aumentará la exigencia de forma progresiva.
          </p>
        </div>

        <div className="grid content-start gap-4 overflow-auto pr-1">
          <div className="rounded-[26px] border border-cyan-400/20 bg-cyan-400/10 p-5">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              Fase actual
            </div>
            <div className="mt-2 text-xl font-black text-white">
              {getPhaseLabel(currentStep.phase)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Fuente utilizada
            </div>
            <div className="text-sm font-black text-white">
              {currentStep.source}
            </div>
            <div className="mt-1 text-xs leading-relaxed text-slate-400">
              {currentStep.source_reference}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Fragmento base
            </div>
            <p className="line-clamp-[12] text-xs leading-relaxed text-slate-400">
              {currentStep.source_fragment}
            </p>
          </div>
        </div>

        <TutorButton variant="secondary" full onClick={onPractice}>
          <Target size={18} />
          Ir a práctica
        </TutorButton>
      </TutorCard>
    </section>
  );
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-3 text-center">
      <div className="text-lg font-black text-white">{value}%</div>
      <div className="mt-1 text-[11px] font-bold uppercase text-slate-500">
        {label}
      </div>
    </div>
  );
}