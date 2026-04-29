import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Bell,
  Clock,
  Download,
  Headphones,
  Mail,
  Save,
  ShieldCheck,
  User,
  Volume2,
  WifiOff,
} from "lucide-react";
import { apiGet, apiPost } from "../api/client";
import type { UserProfile, UserProfileCreate } from "../api/types";
import {
  SectionHeader,
  StatusPill,
  TutorButton,
  TutorCard,
  TutorEmptyState,
} from "../components/ui";

interface SettingsPageProps {
  onProfileUpdated?: (profile: UserProfile) => void;
}

export function SettingsPage({ onProfileUpdated }: SettingsPageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [email, setEmail] = useState("");

  const [dailyStudyMinutes, setDailyStudyMinutes] = useState("45");
  const [preferredStudyTime, setPreferredStudyTime] = useState("20:00");
  const [studyMode, setStudyMode] = useState("guided");

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceMode, setVoiceMode] = useState("piper");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const result = await apiGet<UserProfile | null>("/profile");

        if (result) {
          setProfile(result);
          setFullName(result.full_name);
          setBirthDate(result.birth_date);
          setEmail(result.email);
          setDailyStudyMinutes(String(result.daily_study_minutes ?? 45));
          setPreferredStudyTime(result.preferred_study_time ?? "20:00");
          setStudyMode(result.study_mode ?? "guided");
          setVoiceEnabled(result.voice_enabled ?? true);
          setVoiceMode(result.voice_mode ?? "piper");
          setNotificationsEnabled(result.notifications_enabled ?? true);
          setOfflineMode(result.offline_mode ?? true);
        }
      } catch {
        setError("No fue posible cargar la configuración.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

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
      setProfile(saved);
      onProfileUpdated?.(saved);
      setMessage("Configuración guardada correctamente.");
    } catch {
      setError("No fue posible guardar la configuración.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <TutorCard className="grid h-full place-items-center p-8">
        <TutorEmptyState
          icon={<ShieldCheck size={28} />}
          title="Cargando ajustes"
          description="Leyendo configuración local del sistema."
        />
      </TutorCard>
    );
  }

  return (
    <section className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_340px] gap-4 overflow-hidden max-[1366px]:grid-cols-[minmax(0,1fr)_310px] max-[1366px]:gap-3">
      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-6 p-6">
        <SectionHeader
          kicker="Configuración"
          icon={<ShieldCheck size={16} />}
          title="Ajustes del sistema"
          description="Administra el perfil local, preferencias de estudio, voz, notificaciones, modo offline y actualizaciones del dispositivo."
          action={
            <StatusPill tone="ok" icon={<WifiOff size={16} />}>
              Configuración local
            </StatusPill>
          }
        />

        <form
          id="settings-form"
          onSubmit={handleSubmit}
          className="min-h-0 overflow-auto pr-2"
        >
          <div className="grid gap-5">
            <TutorCard className="bg-slate-900/55 p-5">
              <SectionBlockHeader
                icon={<User size={20} />}
                title="Perfil del postulante"
                description="Datos principales asociados al uso local del sistema."
              />

              <div className="mt-5 grid grid-cols-2 gap-4">
                <TextField
                  label="Nombre completo"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Nombre completo"
                />

                <DateField
                  label="Fecha de nacimiento"
                  value={birthDate}
                  onChange={setBirthDate}
                />

                <div className="col-span-2">
                  <EmailField value={email} onChange={setEmail} />
                </div>
              </div>
            </TutorCard>

            <TutorCard className="bg-slate-900/55 p-5">
              <SectionBlockHeader
                icon={<Clock size={20} />}
                title="Preferencias de estudio"
                description="Define cómo se organizará el trabajo diario del tutor."
              />

              <div className="mt-5 grid grid-cols-3 gap-4">
                <SelectField
                  label="Minutos diarios"
                  value={dailyStudyMinutes}
                  onChange={setDailyStudyMinutes}
                  options={[
                    ["30", "30 minutos"],
                    ["45", "45 minutos"],
                    ["60", "60 minutos"],
                    ["90", "90 minutos"],
                  ]}
                />

                <TimeField
                  label="Hora sugerida"
                  value={preferredStudyTime}
                  onChange={setPreferredStudyTime}
                />

                <SelectField
                  label="Modo de estudio"
                  value={studyMode}
                  onChange={setStudyMode}
                  options={[
                    ["guided", "Tutor guiado"],
                    ["balanced", "Balanceado"],
                    ["practice", "Práctica intensiva"],
                  ]}
                />
              </div>
            </TutorCard>

            <TutorCard className="bg-slate-900/55 p-5">
              <SectionBlockHeader
                icon={<Volume2 size={20} />}
                title="Voz y audio"
                description="Configura el motor de voz y la interacción hablada."
              />

              <div className="mt-5 grid grid-cols-2 gap-4">
                <SelectField
                  label="Motor de voz"
                  value={voiceMode}
                  onChange={setVoiceMode}
                  options={[
                    ["piper", "Piper TTS local"],
                    ["browser", "Voz del navegador"],
                    ["disabled", "Sin voz"],
                  ]}
                />

                <ToggleRow
                  icon={<Headphones size={18} />}
                  title="Voz del tutor"
                  description="Permitir lectura de lecciones y pasos guiados."
                  checked={voiceEnabled}
                  onChange={setVoiceEnabled}
                />
              </div>
            </TutorCard>

            <TutorCard className="bg-slate-900/55 p-5">
              <SectionBlockHeader
                icon={<Bell size={20} />}
                title="Notificaciones y operación"
                description="Preferencias generales del dispositivo."
              />

              <div className="mt-5 grid grid-cols-2 gap-4">
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
            </TutorCard>

            {error && (
              <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                {message}
              </div>
            )}
          </div>
        </form>

        <div className="flex justify-end">
          <TutorButton
            form="settings-form"
            type="submit"
            variant="primary"
            disabled={saving}
          >
            <Save size={18} />
            {saving ? "Guardando..." : "Guardar ajustes"}
          </TutorButton>
        </div>
      </TutorCard>

      <TutorCard className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 p-5">
        <div>
          <h2 className="text-xl font-black text-white">
            Estado de configuración
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Resumen actual del dispositivo.
          </p>
        </div>

        <div className="grid content-start gap-4 overflow-auto pr-1">
          <SummaryRow title="Perfil" value={profile?.full_name ?? "Sin perfil"} />
          <SummaryRow title="Estudio diario" value={`${dailyStudyMinutes} min`} />
          <SummaryRow title="Hora sugerida" value={preferredStudyTime} />
          <SummaryRow title="Modo estudio" value={studyMode} />
          <SummaryRow title="Voz" value={voiceEnabled ? voiceMode : "disabled"} />
          <SummaryRow
            title="Notificaciones"
            value={notificationsEnabled ? "Activas" : "Desactivadas"}
          />
          <SummaryRow
            title="Modo offline"
            value={offlineMode ? "Prioritario" : "No prioritario"}
          />

          <TutorCard className="bg-slate-900/55 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                <Download size={18} />
              </div>

              <div>
                <div className="text-sm font-black text-white">
                  Actualizaciones
                </div>
                <div className="text-xs text-slate-400">
                  La gestión de paquetes se integrará en esta sección.
                </div>
              </div>
            </div>
          </TutorCard>
        </div>
      </TutorCard>
    </section>
  );
}

function SectionBlockHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
        {icon}
      </div>

      <div>
        <h2 className="text-lg font-black text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <input
        className="min-h-12 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <input
        className="min-h-12 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <input
        className="min-h-12 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function EmailField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-300">Correo electrónico</span>

      <div className="grid grid-cols-[44px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/70 focus-within:border-cyan-300/50 focus-within:ring-2 focus-within:ring-cyan-300/10">
        <div className="grid place-items-center text-slate-500">
          <Mail size={18} />
        </div>

        <input
          className="min-h-12 bg-transparent pr-4 text-sm text-white outline-none placeholder:text-slate-600"
          type="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="correo@ejemplo.cl"
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <select
        className="min-h-12 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 text-sm text-white outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
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

function SummaryRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/55 px-4 py-3">
      <span className="text-sm text-slate-400">{title}</span>
      <strong className="text-right text-sm text-white">{value}</strong>
    </div>
  );
}