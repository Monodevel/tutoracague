import {
  BellRing,
  Bluetooth,
  Brain,
  CheckCircle2,
  Download,
  Headphones,
  LockKeyhole,
  Music2,
  Pause,
  Play,
  RefreshCw,
  Settings,
  SkipBack,
  SkipForward,
  Sparkles,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import type { DeviceStatus } from "../../api/types";
import { StatusPill, TutorButton, TutorCard } from "../ui";

interface RightPanelProps {
  open: boolean;
  onClose: () => void;
  deviceStatus: DeviceStatus | null;
}

const notifications = [
  {
    id: 1,
    title: "Sesión sugerida",
    description: "Continúa con el último tema pendiente.",
    type: "study",
    time: "Ahora",
  },
  {
    id: 2,
    title: "Práctica recomendada",
    description: "Realiza una práctica breve para reforzar comprensión.",
    type: "practice",
    time: "Hoy",
  },
  {
    id: 3,
    title: "Actualizaciones",
    description: "No hay paquetes pendientes de instalación.",
    type: "update",
    time: "Sistema",
  },
];

function DeviceTile({
  icon,
  title,
  value,
  active = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        "min-h-[92px] rounded-[24px] border p-4 transition",
        active
          ? "border-cyan-400/30 bg-cyan-400/10"
          : "border-slate-700/60 bg-slate-900/55",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={[
            "grid h-11 w-11 place-items-center rounded-2xl border",
            active
              ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200"
              : "border-slate-700 bg-slate-950/60 text-slate-300",
          ].join(" ")}
        >
          {icon}
        </div>

        <div
          className={[
            "h-2.5 w-2.5 rounded-full",
            active ? "bg-emerald-400" : "bg-slate-600",
          ].join(" ")}
        />
      </div>

      <div className="mt-3">
        <div className="text-sm font-black text-white">{title}</div>
        <div className="mt-1 truncate text-xs text-slate-400">{value}</div>
      </div>
    </div>
  );
}

export function RightPanel({
  open,
  onClose,
  deviceStatus,
}: RightPanelProps) {
  const isOnline = deviceStatus?.online ?? false;
  const bluetoothConnected = deviceStatus?.bluetooth.connected ?? false;
  const audioAvailable = deviceStatus?.audio.available ?? false;
  const aiAvailable = deviceStatus?.ai.available ?? false;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "fixed right-0 top-0 z-50 h-screen w-[410px] max-w-[94vw]",
          "border-l border-slate-700/70 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-2xl",
          "transition-transform duration-300 ease-out",
          "grid grid-rows-[auto_minmax(0,1fr)]",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                <Sparkles size={21} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-white">
                  Centro TutorAcague
                </h2>
                <p className="truncate text-xs text-slate-400">
                  Notificaciones y dispositivos
                </p>
              </div>
            </div>
          </div>

          <button
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-cyan-300/40 hover:text-white active:scale-95"
            onClick={onClose}
            aria-label="Cerrar panel"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 overflow-auto p-5">
          <div className="grid gap-5">
            <TutorCard className="p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white">
                    Dispositivos
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Estado rápido del sistema.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DeviceTile
                  icon={isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
                  title="Red"
                  value={deviceStatus?.wifi ?? "Offline"}
                  active={isOnline}
                />

                <DeviceTile
                  icon={<Bluetooth size={20} />}
                  title="Bluetooth"
                  value={
                    bluetoothConnected
                      ? deviceStatus?.bluetooth.device_name ?? "Conectado"
                      : "Sin conexión"
                  }
                  active={bluetoothConnected}
                />

                <DeviceTile
                  icon={<Headphones size={20} />}
                  title="Audio"
                  value={deviceStatus?.audio.active_device ?? "No verificado"}
                  active={audioAvailable}
                />

                <DeviceTile
                  icon={<Brain size={20} />}
                  title="IA local"
                  value={deviceStatus?.ai.status ?? "No verificada"}
                  active={aiAvailable}
                />
              </div>
            </TutorCard>

            <TutorCard className="p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white">
                    Seguridad y licencia
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Validación del dispositivo.
                  </p>
                </div>

                <StatusPill tone="ok" icon={<LockKeyhole size={15} />}>
                  {deviceStatus?.license.label ?? "Licencia"}
                </StatusPill>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/55 px-4 py-3">
                  <span className="text-sm text-slate-400">
                    Estado licencia
                  </span>
                  <strong className="text-right text-sm text-white">
                    {deviceStatus?.license.label ?? "No verificada"}
                  </strong>
                </div>

                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/55 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-400">
                      Actualización instalada
                    </span>
                    <strong className="text-right text-sm text-white">
                      {deviceStatus?.update?.installed_version ?? "--"}
                    </strong>
                  </div>

                  <div className="mt-2 text-xs leading-relaxed text-slate-500">
                    {deviceStatus?.update?.installed_label ?? "Sin actualización registrada"}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Instalado: {deviceStatus?.update?.installed_at ?? "--/--/----"}
                  </div>
                </div>
              </div>
            </TutorCard>

            <TutorCard className="p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white">
                    Notificaciones
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Avisos de estudio y sistema.
                  </p>
                </div>

                <StatusPill tone="info" icon={<BellRing size={15} />}>
                  {notifications.length}
                </StatusPill>
              </div>

              <div className="grid gap-3">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/55 p-3"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                      {item.type === "update" ? (
                        <Download size={18} />
                      ) : item.type === "practice" ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <BellRing size={18} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-sm font-black leading-tight text-white">
                          {item.title}
                        </strong>
                        <span className="shrink-0 text-[11px] font-bold text-slate-500">
                          {item.time}
                        </span>
                      </div>

                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TutorCard>

            <TutorCard className="p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white">
                    Música de concentración
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Control Spotify opcional.
                  </p>
                </div>

                <StatusPill
                  tone={isOnline ? "info" : "warn"}
                  icon={<Music2 size={15} />}
                >
                  {isOnline ? "Spotify" : "Offline"}
                </StatusPill>
              </div>

              <div className="rounded-[24px] border border-slate-700/60 bg-slate-900/55 p-4">
                <div className="grid grid-cols-[58px_minmax(0,1fr)] gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-green-400/20 bg-green-400/10 text-green-200">
                    <Music2 size={24} />
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Spotify
                    </div>

                    <div className="mt-1 truncate text-sm font-black text-white">
                      No conectado
                    </div>

                    <div className="mt-1 truncate text-xs text-slate-400">
                      Controlará una sesión externa de Spotify.
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    disabled
                    className="grid min-h-11 place-items-center rounded-2xl border border-slate-700/60 bg-slate-950/60 text-slate-500 disabled:opacity-50"
                    aria-label="Anterior"
                  >
                    <SkipBack size={18} />
                  </button>

                  <button
                    disabled
                    className="grid min-h-11 place-items-center rounded-2xl border border-slate-700/60 bg-slate-950/60 text-slate-500 disabled:opacity-50"
                    aria-label="Reproducir o pausar"
                  >
                    <Play size={18} />
                  </button>

                  <button
                    disabled
                    className="grid min-h-11 place-items-center rounded-2xl border border-slate-700/60 bg-slate-950/60 text-slate-500 disabled:opacity-50"
                    aria-label="Siguiente"
                  >
                    <SkipForward size={18} />
                  </button>
                </div>

                <div className="mt-4 grid gap-2">
                  <TutorButton variant="primary" full disabled={!isOnline}>
                    <Music2 size={18} />
                    Conectar Spotify
                  </TutorButton>

                  <TutorButton variant="secondary" full disabled>
                    <RefreshCw size={18} />
                    Actualizar estado
                  </TutorButton>
                </div>
              </div>
            </TutorCard>

            <TutorCard className="p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white">
                    Ajustes rápidos
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Opciones del centro lateral.
                  </p>
                </div>

                <Settings size={20} className="text-cyan-200" />
              </div>

              <div className="grid gap-2">
                <TutorButton variant="secondary" full>
                  <Download size={18} />
                  Ver actualizaciones
                </TutorButton>

                <TutorButton variant="secondary" full onClick={onClose}>
                  <Pause size={18} />
                  Ocultar panel
                </TutorButton>
              </div>
            </TutorCard>
          </div>
        </div>
      </aside>
    </>
  );
}