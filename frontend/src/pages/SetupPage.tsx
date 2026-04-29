import { useState } from "react";
import type { FormEvent } from "react";
import { Check, Mail, ShieldCheck, User, WifiOff } from "lucide-react";
import { apiPost } from "../api/client";
import type { UserProfile, UserProfileCreate } from "../api/types";
import {
  SectionHeader,
  StatusPill,
  TutorButton,
  TutorCard,
} from "../components/ui";

interface SetupPageProps {
  onCompleted: (profile: UserProfile) => void;
}

export function SetupPage({ onCompleted }: SetupPageProps) {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [email, setEmail] = useState("");

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

        daily_study_minutes: 45,
        preferred_study_time: "20:00",
        voice_enabled: true,
        voice_mode: "piper",
        notifications_enabled: true,
        offline_mode: true,
        study_mode: "guided",
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
      <section className="grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_330px] gap-5">
        <TutorCard className="p-7">
          <SectionHeader
            kicker="Primer arranque"
            icon={<ShieldCheck size={16} />}
            title="Bienvenido a TutorAcague"
            description="Antes de comenzar, se creará el perfil local del postulante. Las demás preferencias podrán ajustarse posteriormente desde Ajustes."
            action={
              <StatusPill tone="ok" icon={<WifiOff size={16} />}>
                Modo local
              </StatusPill>
            }
          />

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <TutorCard className="bg-slate-900/55 p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                  <User size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-black text-white">
                    Perfil inicial
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Datos mínimos para iniciar el sistema.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
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

                <label className="grid gap-2">
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

            {error && (
              <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <TutorButton type="submit" variant="primary" disabled={saving}>
                <Check size={18} />
                {saving ? "Guardando..." : "Iniciar TutorAcague"}
              </TutorButton>
            </div>
          </form>
        </TutorCard>

        <TutorCard className="grid content-center gap-5 p-6">
          <div className="grid place-items-center rounded-[30px] border border-cyan-400/20 bg-cyan-400/10 p-6">
            <div className="grid h-24 w-24 place-items-center rounded-[32px] bg-cyan-300 text-slate-950 shadow-2xl shadow-cyan-500/20">
              <ShieldCheck size={48} />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">
              Sistema de estudio local
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              TutorAcague funciona como un dispositivo dedicado para preparación,
              enseñanza guiada, práctica y seguimiento del postulante.
            </p>
          </div>
        </TutorCard>
      </section>
    </main>
  );
}