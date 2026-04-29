import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  ShieldCheck,
  Square,
  Target,
  Volume2,
} from "lucide-react";
import { apiGet, apiPost } from "../api/client";
import type {
  Lesson,
  StudyTopicDetail,
  TutorExplainResponse,
} from "../api/types";
import { usePiperSpeech } from "../hooks/usePiperSpeech";
import {
  SectionHeader,
  StatusPill,
  TutorButton,
  TutorCard,
  TutorEmptyState,
} from "../components/ui";

interface StudySessionPageProps {
  topicId: number;
  onBack: () => void;
  onPractice: () => void;
  onStartTeaching: (topic: StudyTopicDetail, lesson: Lesson) => void;
}

export function StudySessionPage({
  topicId,
  onBack,
  onPractice,
  onStartTeaching,
}: StudySessionPageProps) {
  const [topic, setTopic] = useState<StudyTopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);

  const [tutorExplanation, setTutorExplanation] =
    useState<TutorExplainResponse | null>(null);

  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState("");

  const { speak, stop, isSpeaking, isLoadingVoice, voiceError } =
    usePiperSpeech();

  useEffect(() => {
    async function loadTopic() {
      try {
        setLoading(true);
        const result = await apiGet<StudyTopicDetail>(
          `/study/topics/${topicId}`
        );
        setTopic(result);
      } finally {
        setLoading(false);
      }
    }

    loadTopic();
  }, [topicId]);

  const selectedLesson = topic?.lessons?.[selectedLessonIndex] ?? null;

  function handleLessonSpeech() {
    if (!selectedLesson) return;

    if (isSpeaking) {
      stop();
      return;
    }

    speak(`${selectedLesson.title}. ${selectedLesson.content}`);
  }

  async function explainWithTutor() {
    if (!topic || !selectedLesson) return;

    try {
      setExplaining(true);
      setExplainError("");
      setTutorExplanation(null);

      const result = await apiPost<TutorExplainResponse>("/tutor/explain", {
        topic_id: topic.id,
        lesson_id: selectedLesson.id,
      });

      setTutorExplanation(result);
    } catch {
      setExplainError(
        "No fue posible generar la explicación. Verifique que Ollama esté activo y que exista contenido suficiente."
      );
    } finally {
      setExplaining(false);
    }
  }

  function handleBack() {
    stop();
    onBack();
  }

  function handlePractice() {
    stop();
    onPractice();
  }

  function handleStartTeaching() {
    if (!topic || !selectedLesson) return;

    stop();
    onStartTeaching(topic, selectedLesson);
  }

  function selectLesson(index: number) {
    stop();
    setSelectedLessonIndex(index);
    setTutorExplanation(null);
    setExplainError("");
  }

  if (loading) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<BookOpen size={28} />}
          title="Cargando lección"
          description="Preparando contenido local para la sesión de estudio."
        />
      </TutorCard>
    );
  }

  if (!topic) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<BookOpen size={28} />}
          title="Tema no disponible"
          description="No fue posible cargar el tema seleccionado."
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
    <section className="grid h-full min-h-0 grid-cols-[320px_minmax(0,1fr)] gap-4 overflow-hidden max-[1366px]:grid-cols-[290px_minmax(0,1fr)] max-[1366px]:gap-3">
      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-white">Lecciones</h2>
            <p className="mt-1 text-sm text-slate-400">
              Selecciona el contenido a estudiar.
            </p>
          </div>

          <StatusPill tone="info">{topic.lessons.length}</StatusPill>
        </div>

        {topic.lessons.length === 0 ? (
          <TutorEmptyState
            icon={<BookOpen size={26} />}
            title="Sin lecciones"
            description="Este tema aún no tiene lecciones cargadas."
          />
        ) : (
          <div className="grid min-h-0 content-start gap-3 overflow-auto pr-1">
            {topic.lessons.map((lesson, index) => {
              const active = index === selectedLessonIndex;

              return (
                <button
                  key={lesson.id}
                  type="button"
                  className={[
                    "grid min-h-[82px] grid-cols-[46px_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                    active
                      ? "border-cyan-300/40 bg-cyan-400/10 text-white shadow-lg shadow-cyan-500/10"
                      : "border-slate-700/60 bg-slate-900/55 text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-400/5",
                  ].join(" ")}
                  onClick={() => selectLesson(index)}
                >
                  <div
                    className={[
                      "grid h-11 w-11 place-items-center rounded-2xl border text-sm font-black",
                      active
                        ? "border-cyan-300/30 bg-cyan-300 text-slate-950"
                        : "border-slate-700/60 bg-slate-950/60 text-cyan-200",
                    ].join(" ")}
                  >
                    {(index + 1).toString().padStart(2, "0")}
                  </div>

                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-black">
                      {lesson.title}
                    </strong>
                    <span className="mt-1 block truncate text-xs text-slate-400">
                      {lesson.source_reference || "Fuente local"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </TutorCard>

      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5 p-6 max-[1366px]:p-5">
        <SectionHeader
          kicker="Contenido local validado"
          icon={<ShieldCheck size={16} />}
          title={topic.name}
          description="Sesión de estudio basada en contenido local. Desde aquí puedes iniciar una tutoría guiada, escuchar la lección, solicitar una explicación con IA local o practicar el tema."
          action={
            <TutorButton variant="secondary" onClick={handleBack}>
              <ArrowLeft size={18} />
              Volver
            </TutorButton>
          }
        />

        {selectedLesson ? (
          <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden">
            <TutorCard className="grid grid-cols-[minmax(0,1fr)_54px] items-center gap-4 bg-slate-900/55 p-4">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Fuente
                </div>

                <div className="mt-1 truncate text-sm font-black text-white">
                  {selectedLesson.official_source}
                </div>

                <div className="mt-1 truncate text-xs text-slate-400">
                  {selectedLesson.source_reference}
                </div>
              </div>

              <div className="grid h-13 w-13 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                <FileText size={22} />
              </div>
            </TutorCard>

            <TutorCard className="min-h-0 overflow-auto bg-slate-950/35 p-6">
              <div className="mx-auto max-w-5xl">
                <h2 className="text-3xl font-black leading-tight text-white max-[1366px]:text-2xl">
                  {selectedLesson.title}
                </h2>

                <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-slate-200 max-[1366px]:text-sm">
                  {selectedLesson.content}
                </p>

                {explainError && (
                  <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
                    {explainError}
                  </div>
                )}

                {voiceError && (
                  <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
                    {voiceError}
                  </div>
                )}

                {tutorExplanation && (
                  <TutorCard className="mt-5 border-cyan-400/20 bg-cyan-400/10 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black text-white">
                          Explicación del tutor
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          IA local basada en contenido cargado.
                        </p>
                      </div>

                      <StatusPill tone="info">IA local</StatusPill>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                      {tutorExplanation.explanation}
                    </p>

                    <div className="mt-5 rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Fuente usada
                      </div>

                      <div className="mt-2 text-sm font-black text-white">
                        {tutorExplanation.source}
                      </div>

                      <div className="mt-1 text-xs leading-relaxed text-slate-400">
                        {tutorExplanation.source_reference}
                      </div>
                    </div>
                  </TutorCard>
                )}
              </div>
            </TutorCard>

            <div className="flex flex-wrap justify-end gap-3">
              <TutorButton variant="primary" onClick={handleStartTeaching}>
                <BookOpen size={18} />
                Iniciar tutor guiado
              </TutorButton>

              <TutorButton
                variant="secondary"
                onClick={handleLessonSpeech}
                disabled={isLoadingVoice}
              >
                {isSpeaking ? <Square size={18} /> : <Volume2 size={18} />}
                {isLoadingVoice
                  ? "Generando voz..."
                  : isSpeaking
                    ? "Detener voz"
                    : "Escuchar lección"}
              </TutorButton>

              <TutorButton
                variant="secondary"
                onClick={explainWithTutor}
                disabled={explaining}
              >
                <HelpCircle size={18} />
                {explaining ? "Explicando..." : "Explicar con tutor"}
              </TutorButton>

              <TutorButton variant="secondary" onClick={handlePractice}>
                <Target size={18} />
                Practicar tema
              </TutorButton>

              <TutorButton variant="ghost">
                <CheckCircle2 size={18} />
                Marcar estudiado
              </TutorButton>
            </div>
          </div>
        ) : (
          <TutorEmptyState
            icon={<BookOpen size={26} />}
            title="Selecciona una lección"
            description="Elige una lección desde el panel izquierdo para comenzar."
          />
        )}
      </TutorCard>
    </section>
  );
}