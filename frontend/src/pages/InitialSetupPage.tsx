import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Bell,
  Check,
  Clock,
  Headphones,
  Mail,
  ShieldCheck,
  User,
  Volume2,
  WifiOff,
} from "lucide-react";
import { apiPost } from "../api/client";
import type { UserProfile, UserProfileCreate } from "../api/types";
import {
  SectionHeader,
  StatusPill,
  TutorButton,
  TutorCard,
} from "../components/ui";

interface InitialSetupPageProps {
  onCompleted: (profile: UserProfile) => void;
}

export function InitialSetupPage({ onCompleted }: InitialSetupPageProps) {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [email, setEmail] = useState("");

  const [dailyStudyMinutes, setDailyStudyMinutes] = useState("45");
  const [preferredStudyTime, setPreferredStudyTime] = useState("20:00");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);
  const [voiceMode, setVoiceMode] = useState("piper");
  const [studyMode, setStudyMode] = useState("guided");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !birthDate) {
        setError("Debe completar nombre, fecha de nacimiento y correo electrónico.");
        return;
    }

    try {
        setSaving(true);

        const payload: UserProfileCreate = {
        full_name: fullName.trim(),
        birth_date: birthDate,
        email: email.trim(),
        initial_setup_completed: true,

        daily_study_minutes: Number(dailyStudyMinutes),
        preferred_study_time: preferredStudyTime,
        voice_enabled: voiceEnabled,
        voice_mode: voiceMode,
        notifications_enabled: notificationsEnabled,
        offline_mode: offlineMode,
        study_mode: studyMode,
        };

        const saved = await apiPost<UserProfile>("/profile", payload);
        onCompleted(saved);
    } catch {
        setError("No fue posible guardar la configuración inicial.");
    } finally {
        setSaving(false);
    }
    }

  return (
    <main className="grid h-screen place-items-center overflow-hidden bg-slate-950 p-6 text-slate-100">
      <section className="grid h-full max-h-[860px] w-full max-w-6xl grid-cols-[minmax(0,1fr)_360px] gap-5">
        <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-6 p-7">
          <SectionHeader
            kicker="Primer inicio"
            icon={<ShieldCheck size={16} />}
            title="Configuración inicial"
            description="TutorAcague creará el perfil local del postulante y definirá las preferencias principales del dispositivo."
            action={
              <StatusPill tone="ok" icon={<WifiOff size={16} />}>
                Modo offline preparado
              </StatusPill>
            }
          />

          <form
            id="initial-setup-form"
            onSubmit={handleSubmit}
            className="min-h-0 overflow-auto pr-2"
          >
            <div className="grid gap-5">
              <TutorCard className="bg-slate-900/55 p-5">
                <div className="mb-5 flex items-center gap-3">
                  <IconBox>
                    <User size={20} />
                  </IconBox>

                  <div>
                    <h2 className="text-lg font-black text-white">
                      Perfil del postulante
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Datos básicos para personalizar la experiencia.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-300">
                      Nombre completo
                    </span>
                    <input
                      className="min-h-12 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Ejemplo: Marco Miranda"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-300">
                      Fecha de nacimiento
                    </span>
                    <input
                      className="min-h-12 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                      type="date"
                      value={birthDate}
                      onChange={(event) => setBirthDate(event.target.value)}
                    />
                  </label>

                  <label className="col-span-2 grid gap-2">
                    <span className="text-sm font-bold text-slate-300">
                      Correo electrónico
                    </span>
                    <div className="grid grid-cols-[44px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/70 focus-within:border-cyan-300/50 focus-within:ring-2 focus-within:ring-cyan-300/10">
                      <div className="grid place-items-center text-slate-500">
                        <Mail size={18} />
                      </div>
                      <input
                        className="min-h-12 bg-transparent pr-4 text-sm text-white outline-none placeholder:text-slate-600"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="correo@ejemplo.cl"
                      />
                    </div>
                  </label>
                </div>
              </TutorCard>

              <TutorCard className="bg-slate-900/55 p-5">
                <div className="mb-5 flex items-center gap-3">
                  <IconBox>
                    <Clock size={20} />
                  </IconBox>

                  <div>
                    <h2 className="text-lg font-black text-white">
                      Preferencias de estudio
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Define cómo TutorAcague organizará la preparación.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-300">
                      Minutos diarios
                    </span>
                    <select
                      className="min-h-12 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 text-sm text-white outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                      value={dailyStudyMinutes}
                      onChange={(event) =>
                        setDailyStudyMinutes(event.target.value)
                      }
                    >
                      <option value="30">30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">60 minutos</option>
                      <option value="90">90 minutos</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-300">
                      Hora sugerida
                    </span>
                    <input
                      className="min-h-12 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 text-sm text-white outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                      type="time"
                      value={preferredStudyTime}
                      onChange={(event) =>
                        setPreferredStudyTime(event.target.value)
                      }
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-300">
                      Modo de estudio
                    </span>
                    <select
                      className="min-h-12 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 text-sm text-white outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                      value={studyMode}
                      onChange={(event) => setStudyMode(event.target.value)}
                    >
                      <option value="guided">Tutor guiado</option>
                      <option value="balanced">Balanceado</option>
                      <option value="practice">Práctica intensiva</option>
                    </select>
                  </label>
                </div>
              </TutorCard>

              <TutorCard className="bg-slate-900/55 p-5">
                <div className="mb-5 flex items-center gap-3">
                  <IconBox>
                    <Volume2 size={20} />
                  </IconBox>

                  <div>
                    <h2 className="text-lg font-black text-white">
                      Voz, audio y notificaciones
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Configuración inicial del entorno de interacción.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-300">
                      Motor de voz
                    </span>
                    <select
                      className="min-h-12 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 text-sm text-white outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                      value={voiceMode}
                      onChange={(event) => setVoiceMode(event.target.value)}
                    >
                      <option value="piper">Piper TTS local</option>
                      <option value="browser">Voz del navegador</option>
                      <option value="disabled">Sin voz</option>
                    </select>
                  </label>

                  <div className="grid gap-3">
                    <ToggleRow
                      icon={<Headphones size={18} />}
                      title="Voz del tutor"
                      description="Permitir lectura de lecciones y pasos guiados."
                      checked={voiceEnabled}
                      onChange={setVoiceEnabled}
                    />

                    <ToggleRow
                      icon={<Bell size={18} />}
                      title="Notificaciones"
                      description="Recordatorios de estudio y avisos del sistema."
                      checked={notificationsEnabled}
                      onChange={setNotificationsEnabled}
                    />

                    <ToggleRow
                      icon={<WifiOff size={18} />}
                      title="Priorizar modo offline"
                      description="Usar contenidos y modelos locales siempre que sea posible."
                      checked={offlineMode}
                      onChange={setOfflineMode}
                    />
                  </div>
                </div>
              </TutorCard>

              {error && (
                <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
                  {error}
                </div>
              )}
            </div>
          </form>

          <div className="flex justify-end">
            <TutorButton
              form="initial-setup-form"
              type="submit"
              variant="primary"
              disabled={saving}
            >
              <Check size={18} />
              {saving ? "Guardando..." : "Iniciar TutorAcague"}
            </TutorButton>
          </div>
        </TutorCard>

        <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 p-6">
          <div className="grid place-items-center rounded-[30px] border border-cyan-400/20 bg-cyan-400/10 p-6">
            <div className="grid h-24 w-24 place-items-center rounded-[32px] bg-cyan-300 text-slate-950 shadow-2xl shadow-cyan-500/20">
              <ShieldCheck size={48} />
            </div>
          </div>

          <div className="grid content-start gap-4 overflow-auto">
            <div>
              <h2 className="text-2xl font-black text-white">
                Dispositivo dedicado
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Esta configuración prepara el perfil local, las preferencias de
                estudio, el uso de voz, el modo offline y los recordatorios
                iniciales del sistema.
              </p>
            </div>

            <div className="grid gap-3">
              <InfoRow title="Contenido" value="Fuentes oficiales o validadas" />
              <InfoRow title="IA" value="Explica y evalúa con respaldo local" />
              <InfoRow title="Voz" value="Compatible con Piper TTS" />
              <InfoRow title="Perfil" value="Personalización del postulante" />
              <InfoRow
                title="Seguridad"
                value="Preparado para licencia por dispositivo"
              />
            </div>
          </div>
        </TutorCard>
      </section>
    </main>
  );
}

function IconBox({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
      {children}
    </div>
  );
}

interface ToggleRowProps {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "grid grid-cols-[38px_minmax(0,1fr)_52px] items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
        checked
          ? "border-cyan-400/30 bg-cyan-400/10"
          : "border-slate-700/60 bg-slate-950/60",
      ].join(" ")}
    >
      <div
        className={[
          "grid h-9 w-9 place-items-center rounded-xl border",
          checked
            ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200"
            : "border-slate-700 bg-slate-900 text-slate-500",
        ].join(" ")}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-sm font-black text-white">{title}</div>
        <div className="mt-1 text-xs leading-relaxed text-slate-400">
          {description}
        </div>
      </div>

      <div
        className={[
          "flex h-7 w-12 items-center rounded-full border p-1 transition",
          checked
            ? "justify-end border-cyan-300/40 bg-cyan-300/20"
            : "justify-start border-slate-700 bg-slate-900",
        ].join(" ")}
      >
        <div
          className={[
            "h-5 w-5 rounded-full transition",
            checked ? "bg-cyan-300" : "bg-slate-600",
          ].join(" ")}
        />
      </div>
    </button>
  );
}

function InfoRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/55 px-4 py-3">
      <span className="text-sm text-slate-400">{title}</span>
      <strong className="text-right text-sm text-white">{value}</strong>
    </div>
  );
}