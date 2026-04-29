import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  ShieldCheck,
  Square,
  Target,
  Volume2,
  XCircle,
} from "lucide-react";
import type {
  Lesson,
  StudyTopicDetail,
  TeachingSession,
  TeachingStep,
} from "../api/types";
import { usePiperSpeech } from "../hooks/usePiperSpeech";
import {
  SectionHeader,
  StatusPill,
  TutorButton,
  TutorCard,
  TutorProgressBar,
} from "../components/ui";

interface TeachingSessionPageProps {
  topic: StudyTopicDetail;
  lesson: Lesson;
  onBack: () => void;
  onPractice: () => void;
}

function buildLocalTeachingSession(
  topic: StudyTopicDetail,
  lesson: Lesson
): TeachingSession {
  const content = lesson.content;

  const steps: TeachingStep[] = [
    {
      id: "objective",
      type: "objective",
      title: "Objetivo de la sesión",
      text: `En esta sesión estudiarás el tema "${topic.name}" a partir del contenido local disponible. El objetivo es comprender la idea central de la lección y verificar tu comprensión antes de practicar.`,
      source_fragment: content,
    },
    {
      id: "explanation-1",
      type: "explanation",
      title: "Explicación inicial del tutor",
      text: content,
      source_fragment: content,
    },
    {
      id: "check-1",
      type: "check_understanding",
      title: "Pregunta de control",
      text: "Antes de avanzar, TutorAcague verificará si comprendiste la idea principal del contenido.",
      question:
        "Según la lección, ¿cuál es la idea principal que debes comprender de este tema?",
      expected_answer:
        "La respuesta debe estar basada en el contenido local de la lección, sin incorporar información externa.",
      source_fragment: content,
    },
    {
      id: "reinforcement-1",
      type: "reinforcement",
      title: "Refuerzo del tutor",
      text: "Lo importante es que puedas explicar el contenido con tus propias palabras, manteniéndote fiel a la fuente. Si no puedes identificar la idea central, conviene repasar nuevamente la explicación antes de pasar a la práctica.",
      source_fragment: content,
    },
    {
      id: "summary",
      type: "summary",
      title: "Cierre de la sesión",
      text: "Has completado la revisión guiada de la lección. El siguiente paso recomendado es realizar una práctica breve para comprobar comprensión y registrar tu avance.",
      source_fragment: content,
    },
  ];

  return {
    topic_id: topic.id,
    topic_name: topic.name,
    lesson_id: lesson.id,
    lesson_title: lesson.title,
    source: lesson.official_source,
    source_reference: lesson.source_reference,
    steps,
  };
}

function getStepIcon(type: string) {
  if (type === "objective") return <Target size={22} />;
  if (type === "explanation") return <BookOpen size={22} />;
  if (type === "check_understanding") return <HelpCircle size={22} />;
  if (type === "reinforcement") return <Lightbulb size={22} />;
  return <CheckCircle2 size={22} />;
}

function getStepLabel(type: string) {
  if (type === "objective") return "Objetivo";
  if (type === "explanation") return "Explicación";
  if (type === "check_understanding") return "Control";
  if (type === "reinforcement") return "Refuerzo";
  if (type === "summary") return "Resumen";
  return "Paso";
}

export function TeachingSessionPage({
  topic,
  lesson,
  onBack,
  onPractice,
}: TeachingSessionPageProps) {
  const session = useMemo(
    () => buildLocalTeachingSession(topic, lesson),
    [topic, lesson]
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "needs_review" | null>(
    null
  );

  const { speak, stop, isSpeaking, isLoadingVoice, voiceError } =
    usePiperSpeech();

  const currentStep = session.steps[currentStepIndex];
  const isLastStep = currentStepIndex === session.steps.length - 1;
  const progress = Math.round(
    ((currentStepIndex + 1) / session.steps.length) * 100
  );

  function goNext() {
    if (!isLastStep) {
      stop();
      setCurrentStepIndex((value) => value + 1);
      setUserAnswer("");
      setFeedback(null);
    }
  }

  function goToStep(index: number) {
    stop();
    setCurrentStepIndex(index);
    setUserAnswer("");
    setFeedback(null);
  }

  function checkUnderstanding() {
    if (!userAnswer.trim()) {
      setFeedback("needs_review");
      return;
    }

    if (userAnswer.trim().length >= 30) {
      setFeedback("correct");
    } else {
      setFeedback("needs_review");
    }
  }

  function getCurrentStepSpeechText() {
    const parts = [currentStep.title, currentStep.text];

    if (currentStep.question) {
      parts.push(`Pregunta de control: ${currentStep.question}`);
    }

    return parts.join(". ");
  }

  function handleSpeech() {
    if (isSpeaking) {
      stop();
      return;
    }

    speak(getCurrentStepSpeechText());
  }

  function handleBack() {
    stop();
    onBack();
  }

  function handlePractice() {
    stop();
    onPractice();
  }

  return (
    <section className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_330px] gap-4 max-[1366px]:grid-cols-[minmax(0,1fr)_300px] max-[1366px]:gap-3">
      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5 p-6 max-[1366px]:p-5">
        <SectionHeader
          kicker="Sesión guiada TutorAcague"
          icon={<ShieldCheck size={16} />}
          title={session.topic_name}
          description={session.lesson_title}
          action={
            <TutorButton variant="secondary" onClick={handleBack}>
              <ArrowLeft size={18} />
              Volver
            </TutorButton>
          }
        />

        <TutorCard
          padded={false}
          className="grid min-h-0 grid-cols-[72px_minmax(0,1fr)] gap-5 overflow-auto bg-slate-950/35 p-6 max-[1366px]:grid-cols-[60px_minmax(0,1fr)] max-[1366px]:p-5"
        >
          <div className="grid h-16 w-16 place-items-center rounded-[22px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 max-[1366px]:h-14 max-[1366px]:w-14">
            {getStepIcon(currentStep.type)}
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusPill tone="info">
                Paso {currentStepIndex + 1} de {session.steps.length}
              </StatusPill>

              <StatusPill tone="default">
                {getStepLabel(currentStep.type)}
              </StatusPill>
            </div>

            <h2 className="text-3xl font-black leading-tight text-white max-[1366px]:text-2xl">
              {currentStep.title}
            </h2>

            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-slate-200 max-[1366px]:text-sm">
              {currentStep.text}
            </p>

            {currentStep.type === "check_understanding" && (
              <TutorCard className="mt-6 grid gap-4 bg-slate-900/55">
                <div className="flex items-start gap-3 text-white">
                  <div className="mt-0.5 text-cyan-200">
                    <MessageCircle size={20} />
                  </div>

                  <strong className="leading-relaxed">
                    {currentStep.question}
                  </strong>
                </div>

                <textarea
                  className="min-h-36 w-full resize-y rounded-2xl border border-slate-700/70 bg-slate-950/60 p-4 text-sm leading-relaxed text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                  value={userAnswer}
                  onChange={(event) => setUserAnswer(event.target.value)}
                  placeholder="Escribe tu respuesta con tus propias palabras..."
                />

                <div>
                  <TutorButton variant="primary" onClick={checkUnderstanding}>
                    <CheckCircle2 size={18} />
                    Verificar comprensión
                  </TutorButton>
                </div>

                {feedback === "correct" && (
                  <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-emerald-200">
                    <CheckCircle2 size={20} />
                    <div>
                      <strong className="block text-sm text-white">
                        Buena respuesta inicial.
                      </strong>
                      <span className="mt-1 block text-sm leading-relaxed text-slate-200">
                        Tu respuesta tiene desarrollo suficiente. El siguiente
                        paso es reforzar la idea y practicar.
                      </span>
                    </div>
                  </div>
                )}

                {feedback === "needs_review" && (
                  <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-amber-200">
                    <XCircle size={20} />
                    <div>
                      <strong className="block text-sm text-white">
                        Respuesta insuficiente.
                      </strong>
                      <span className="mt-1 block text-sm leading-relaxed text-slate-200">
                        Intenta explicar la idea principal con mayor detalle y
                        usando solo lo indicado en la lección.
                      </span>
                    </div>
                  </div>
                )}
              </TutorCard>
            )}

            {voiceError && (
              <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
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

          {!isLastStep && (
            <TutorButton variant="primary" onClick={goNext}>
              Continuar
              <ChevronRight size={18} />
            </TutorButton>
          )}

          {isLastStep && (
            <TutorButton variant="primary" onClick={handlePractice}>
              Practicar tema
              <ChevronRight size={18} />
            </TutorButton>
          )}
        </div>
      </TutorCard>

      <TutorCard className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Progreso</h2>
            <p className="mt-1 text-xs text-slate-400">
              Avance de sesión guiada
            </p>
          </div>

          <StatusPill tone="info">{progress}%</StatusPill>
        </div>

        <TutorProgressBar value={progress} />

        <div className="grid min-h-0 content-start gap-3 overflow-auto pr-1">
          {session.steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isDone = index < currentStepIndex;

            return (
              <button
                key={step.id}
                className={[
                  "grid min-h-[76px] grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                  isActive
                    ? "border-cyan-300/40 bg-cyan-400/10"
                    : "border-slate-700/60 bg-slate-900/55 hover:border-cyan-300/30 hover:bg-cyan-400/5",
                  isDone ? "border-emerald-400/25" : "",
                ].join(" ")}
                onClick={() => goToStep(index)}
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-xs font-black text-cyan-200">
                  {(index + 1).toString().padStart(2, "0")}
                </div>

                <div className="min-w-0">
                  <strong className="block truncate text-sm font-black text-white">
                    {step.title}
                  </strong>
                  <span className="mt-1 block text-xs text-slate-400">
                    {getStepLabel(step.type)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <TutorCard className="bg-slate-900/55 p-4">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Fuente utilizada
          </div>

          <div className="mt-2 text-sm font-black text-white">
            {session.source}
          </div>

          <div className="mt-1 text-xs leading-relaxed text-slate-400">
            {session.source_reference}
          </div>
        </TutorCard>
      </TutorCard>
    </section>
  );
}