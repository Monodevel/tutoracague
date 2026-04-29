import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  Target,
  XCircle,
} from "lucide-react";
import { apiGet, apiPost } from "../api/client";
import type {
  PracticeAnswerRequest,
  PracticeAnswerResponse,
  PracticeGenerateRequest,
  PracticeGenerateResponse,
  PracticeQuestion,
  PracticeResultCreate,
  StudyArea,
} from "../api/types";
import {
  SectionHeader,
  StatusPill,
  TutorButton,
  TutorCard,
  TutorEmptyState,
  TutorProgressBar,
} from "../components/ui";

interface PracticePageProps {
  initialTopicId?: number | null;
}

function getSourceModeLabel(sourceMode: string): string {
  if (sourceMode === "local_ai_generated") return "IA local";
  if (sourceMode === "imported_questions") return "Preguntas importadas";
  if (sourceMode === "mixed_imported_and_generated")
    return "Importadas + generadas";
  if (sourceMode === "local_official_content") return "Generador local";
  return "Contenido local";
}

export function PracticePage({ initialTopicId = null }: PracticePageProps) {
  const [areas, setAreas] = useState<StudyArea[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(
    initialTopicId
  );

  const [practice, setPractice] = useState<PracticeGenerateResponse | null>(
    null
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [answerResult, setAnswerResult] =
    useState<PracticeAnswerResponse | null>(null);

  const [loadingAreas, setLoadingAreas] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [resultSaved, setResultSaved] = useState(false);

  useEffect(() => {
    async function loadAreas() {
      try {
        const result = await apiGet<StudyArea[]>("/study/areas");
        setAreas(result);

        if (!selectedTopicId) {
          const firstTopic = result[0]?.topics[0];

          if (firstTopic) {
            setSelectedTopicId(firstTopic.id);
          }
        }
      } catch {
        setError("No fue posible cargar los temas disponibles.");
      } finally {
        setLoadingAreas(false);
      }
    }

    loadAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTopic = useMemo(() => {
    for (const area of areas) {
      const topic = area.topics.find((item) => item.id === selectedTopicId);
      if (topic) return topic;
    }

    return null;
  }, [areas, selectedTopicId]);

  const selectedArea = useMemo(() => {
    return (
      areas.find((area) =>
        area.topics.some((topic) => topic.id === selectedTopicId)
      ) ?? null
    );
  }, [areas, selectedTopicId]);

  const currentQuestion: PracticeQuestion | null =
    practice?.questions[currentIndex] ?? null;

  const isLastQuestion =
    practice !== null && currentIndex === practice.questions.length - 1;

  const progress =
    practice && practice.questions.length > 0
      ? Math.round(((currentIndex + 1) / practice.questions.length) * 100)
      : 0;

  async function generatePractice(useAi: boolean = false) {
    if (!selectedTopicId) return;

    try {
      setGenerating(true);
      setError("");
      setPractice(null);
      setCurrentIndex(0);
      setSelectedOption("");
      setAnswerResult(null);
      setCorrectCount(0);
      setIncorrectCount(0);
      setResultSaved(false);

      const payload: PracticeGenerateRequest = {
        topic_id: selectedTopicId,
        question_count: 5,
      };

      const endpoint = useAi ? "/practice/generate-ai" : "/practice/generate";

      const result = await apiPost<PracticeGenerateResponse>(
        endpoint,
        payload
      );

      setPractice(result);
    } catch {
      setError(
        useAi
          ? "No fue posible generar la práctica con IA. Verifique que Ollama esté activo y que el tema tenga contenido suficiente."
          : "No fue posible generar la práctica. Verifique que el tema tenga lecciones cargadas."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function checkAnswer() {
    if (!currentQuestion || !selectedOption) return;

    try {
      setChecking(true);
      setError("");

      const payload: PracticeAnswerRequest = {
        question: currentQuestion,
        selected_option: selectedOption,
      };

      const result = await apiPost<PracticeAnswerResponse>(
        "/practice/answer",
        payload
      );

      setAnswerResult(result);

      if (result.is_correct) {
        setCorrectCount((value) => value + 1);
      } else {
        setIncorrectCount((value) => value + 1);
      }
    } catch {
      setError("No fue posible corregir la respuesta.");
    } finally {
      setChecking(false);
    }
  }

  async function saveFinalResult() {
    if (!practice || resultSaved) return;

    const total = practice.questions.length;
    const correct = correctCount;
    const incorrect = incorrectCount;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    const payload: PracticeResultCreate = {
      topic_id: practice.topic_id,
      topic_name: practice.topic_name,
      source_mode: practice.source_mode,
      total_questions: total,
      correct_answers: correct,
      incorrect_answers: incorrect,
      score_percentage: score,
    };

    await apiPost("/results/practice", payload);
    setResultSaved(true);
  }

  function nextQuestion() {
    if (!practice) return;

    const nextIndex = currentIndex + 1;

    if (nextIndex < practice.questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedOption("");
      setAnswerResult(null);
    }
  }

  function resetPractice() {
    setPractice(null);
    setAnswerResult(null);
    setSelectedOption("");
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setResultSaved(false);
  }

  if (loadingAreas) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<Target size={28} />}
          title="Cargando temas"
          description="Preparando estructura local de práctica."
        />
      </TutorCard>
    );
  }

  return (
    <section className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_340px] gap-4 overflow-hidden max-[1366px]:grid-cols-[minmax(0,1fr)_310px] max-[1366px]:gap-3">
      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 p-6 max-[1366px]:p-5">
        <SectionHeader
          kicker="Práctica basada en contenido"
          icon={<ShieldCheck size={16} />}
          title="Practicar"
          description="Genera preguntas desde contenidos locales, responde y recibe corrección con fuente, referencia y fragmento utilizado."
          action={
            <StatusPill tone="info" icon={<Target size={16} />}>
              Evaluación
            </StatusPill>
          }
        />

        {error && (
          <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {!practice && (
          <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_320px] gap-4 overflow-hidden max-[1366px]:grid-cols-[minmax(0,1fr)_290px] max-[1366px]:gap-3">
            <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 bg-slate-950/35 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">
                    Seleccione un tema
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Contenido local disponible.
                  </p>
                </div>

                <StatusPill tone="default">
                  {areas.reduce((total, area) => total + area.topics.length, 0)}
                </StatusPill>
              </div>

              <div className="grid min-h-0 content-start gap-4 overflow-auto pr-1">
                {areas.map((area) => (
                  <div key={area.id} className="grid gap-2">
                    <div className="px-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      {area.name}
                    </div>

                    <div className="grid gap-2">
                      {area.topics.map((topic) => {
                        const active = topic.id === selectedTopicId;

                        return (
                          <button
                            key={topic.id}
                            type="button"
                            className={[
                              "grid min-h-[74px] grid-cols-[minmax(0,1fr)_24px] items-center gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.99]",
                              active
                                ? "border-cyan-300/40 bg-cyan-400/10 text-white shadow-lg shadow-cyan-500/10"
                                : "border-slate-700/60 bg-slate-900/55 text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-400/5",
                            ].join(" ")}
                            onClick={() => setSelectedTopicId(topic.id)}
                          >
                            <div className="min-w-0">
                              <strong className="block truncate text-sm font-black">
                                {topic.name}
                              </strong>

                              <span className="mt-1 block truncate text-xs text-slate-400">
                                {area.weight_percentage}% ponderación
                              </span>
                            </div>

                            <ChevronRight
                              size={18}
                              className={
                                active ? "text-cyan-200" : "text-slate-500"
                              }
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </TutorCard>

            <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5 p-5">
              <div>
                <h2 className="text-xl font-black text-white">
                  Configurar práctica
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Selecciona el modo de generación.
                </p>
              </div>

              {selectedTopic ? (
                <div className="grid content-start gap-4 overflow-auto pr-1">
                  <div className="rounded-[26px] border border-cyan-400/20 bg-cyan-400/10 p-5">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                      Tema seleccionado
                    </div>

                    <div className="mt-2 text-xl font-black leading-tight text-white">
                      {selectedTopic.name}
                    </div>

                    {selectedArea && (
                      <div className="mt-2 text-sm text-slate-400">
                        {selectedArea.name}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-700/40 pb-3">
                      <span className="text-sm text-slate-400">Modo</span>
                      <strong className="text-right text-sm text-white">
                        Contenido local
                      </strong>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-b border-slate-700/40 pb-3">
                      <span className="text-sm text-slate-400">Internet</span>
                      <strong className="text-right text-sm text-white">
                        No requerido
                      </strong>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-400">IA local</span>
                      <strong className="text-right text-sm text-white">
                        Opcional
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <TutorEmptyState
                  icon={<HelpCircle size={26} />}
                  title="Seleccione un tema"
                  description="Elige un tema para iniciar una práctica."
                />
              )}

              <div className="grid gap-3">
                <TutorButton
                  variant="secondary"
                  full
                  onClick={() => generatePractice(false)}
                  disabled={generating || !selectedTopicId}
                >
                  <Target size={18} />
                  {generating ? "Generando..." : "Práctica rápida"}
                </TutorButton>

                <TutorButton
                  variant="primary"
                  full
                  onClick={() => generatePractice(true)}
                  disabled={generating || !selectedTopicId}
                >
                  <Target size={18} />
                  {generating ? "Generando..." : "Generar con IA"}
                </TutorButton>
              </div>
            </TutorCard>
          </div>
        )}

        {practice && currentQuestion && (
          <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_340px] gap-4 overflow-hidden max-[1366px]:grid-cols-[minmax(0,1fr)_310px] max-[1366px]:gap-3">
            <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5 bg-slate-950/35 p-5">
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusPill tone="info">
                    Pregunta {currentIndex + 1} de {practice.questions.length}
                  </StatusPill>

                  <StatusPill tone="default">
                    {getSourceModeLabel(practice.source_mode)}
                  </StatusPill>
                </div>

                <TutorProgressBar value={progress} />
              </div>

              <div className="min-h-0 overflow-auto pr-1">
                <h2 className="text-2xl font-black leading-tight text-white max-[1366px]:text-xl">
                  {currentQuestion.question}
                </h2>

                <div className="mt-6 grid gap-3">
                  {currentQuestion.options.map((option) => {
                    const active = selectedOption === option.label;

                    return (
                      <button
                        key={option.label}
                        type="button"
                        disabled={answerResult !== null}
                        className={[
                          "grid min-h-[72px] grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                          active
                            ? "border-cyan-300/40 bg-cyan-400/10 text-white"
                            : "border-slate-700/60 bg-slate-900/55 text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-400/5",
                          answerResult !== null
                            ? "cursor-not-allowed opacity-75"
                            : "",
                        ].join(" ")}
                        onClick={() => setSelectedOption(option.label)}
                      >
                        <div
                          className={[
                            "grid h-11 w-11 place-items-center rounded-2xl border text-sm font-black",
                            active
                              ? "border-cyan-300/30 bg-cyan-300 text-slate-950"
                              : "border-slate-700/60 bg-slate-950/60 text-cyan-200",
                          ].join(" ")}
                        >
                          {option.label}
                        </div>

                        <div className="text-sm font-semibold leading-relaxed">
                          {option.text}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                {!answerResult && (
                  <TutorButton
                    variant="primary"
                    onClick={checkAnswer}
                    disabled={!selectedOption || checking}
                  >
                    <CheckCircle2 size={18} />
                    {checking ? "Corrigiendo..." : "Responder"}
                  </TutorButton>
                )}

                {answerResult && !isLastQuestion && (
                  <TutorButton variant="primary" onClick={nextQuestion}>
                    Siguiente pregunta
                    <ChevronRight size={18} />
                  </TutorButton>
                )}

                {answerResult && isLastQuestion && (
                  <TutorButton
                    variant="secondary"
                    onClick={async () => {
                      await saveFinalResult();
                      resetPractice();
                    }}
                  >
                    {resultSaved
                      ? "Resultado guardado"
                      : "Finalizar y guardar"}
                  </TutorButton>
                )}
              </div>
            </TutorCard>

            <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 p-5">
              <div>
                <h2 className="text-xl font-black text-white">
                  Corrección
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Fuente y retroalimentación.
                </p>
              </div>

              {!answerResult ? (
                <TutorEmptyState
                  icon={<BookOpen size={28} />}
                  title="Corrección con fuente"
                  description="Después de responder, TutorAcague mostrará la explicación y el fragmento de contenido utilizado."
                />
              ) : (
                <div className="grid content-start gap-4 overflow-auto pr-1">
                  <div
                    className={[
                      "rounded-[26px] border p-5",
                      answerResult.is_correct
                        ? "border-emerald-400/25 bg-emerald-400/10"
                        : "border-red-400/25 bg-red-400/10",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "mb-4 grid h-14 w-14 place-items-center rounded-2xl border",
                        answerResult.is_correct
                          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                          : "border-red-400/25 bg-red-400/10 text-red-200",
                      ].join(" ")}
                    >
                      {answerResult.is_correct ? (
                        <CheckCircle2 size={28} />
                      ) : (
                        <XCircle size={28} />
                      )}
                    </div>

                    <h3 className="text-xl font-black text-white">
                      {answerResult.is_correct
                        ? "Respuesta correcta"
                        : "Respuesta incorrecta"}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-slate-200">
                      {answerResult.explanation}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Fuente
                    </div>

                    <div className="mt-2 text-sm font-black text-white">
                      {answerResult.source}
                    </div>

                    <div className="mt-1 text-xs leading-relaxed text-slate-400">
                      {answerResult.source_reference}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Fragmento utilizado
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                      {answerResult.source_fragment}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                      <div className="text-xs font-black uppercase text-emerald-200">
                        Correctas
                      </div>
                      <div className="mt-2 text-3xl font-black text-white">
                        {correctCount}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
                      <div className="text-xs font-black uppercase text-red-200">
                        Incorrectas
                      </div>
                      <div className="mt-2 text-3xl font-black text-white">
                        {incorrectCount}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TutorCard>
          </div>
        )}
      </TutorCard>

      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Estado práctica</h2>
          <p className="mt-1 text-sm text-slate-400">
            Seguimiento de la sesión actual.
          </p>
        </div>

        <div className="grid content-start gap-4 overflow-auto pr-1">
          <div className="rounded-[26px] border border-cyan-400/20 bg-cyan-400/10 p-5">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              Tema
            </div>

            <div className="mt-2 text-lg font-black leading-tight text-white">
              {practice?.topic_name ?? selectedTopic?.name ?? "Sin selección"}
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-700/40 pb-3">
              <span className="text-sm text-slate-400">Preguntas</span>
              <strong className="text-right text-sm text-white">
                {practice?.questions.length ?? 0}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-slate-700/40 pb-3">
              <span className="text-sm text-slate-400">Correctas</span>
              <strong className="text-right text-sm text-white">
                {correctCount}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-400">Incorrectas</span>
              <strong className="text-right text-sm text-white">
                {incorrectCount}
              </strong>
            </div>
          </div>

          {practice && (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Avance
              </div>

              <TutorProgressBar value={progress} />
            </div>
          )}
        </div>

        {practice && (
          <TutorButton variant="ghost" full onClick={resetPractice}>
            Cancelar práctica
          </TutorButton>
        )}
      </TutorCard>
    </section>
  );
}