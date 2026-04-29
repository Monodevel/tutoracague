import {
  Bell,
  CalendarDays,
  Clock,
} from "lucide-react";
import type { DeviceStatus, UserProfile } from "../api/types";
import { StatusPill, TutorButton } from "./ui";

interface TopbarProps {
  profile: UserProfile | null;
  deviceStatus: DeviceStatus | null;
  onOpenRightPanel: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

function getFirstName(profile: UserProfile | null): string {
  if (!profile?.full_name) return "Postulante";
  return profile.full_name.trim().split(" ")[0] ?? "Postulante";
}

export function Topbar({
  profile,
  deviceStatus,
  onOpenRightPanel,
}: TopbarProps) {
  return (
    <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-800/70 bg-slate-950/45 px-5 py-3 backdrop-blur-xl">
      <div className="min-w-0">
        <div className="truncate text-xl font-black text-white">
          {getGreeting()},{" "}
          <span className="text-cyan-200">{getFirstName(profile)}</span>
        </div>

        <div className="mt-1 truncate text-sm text-slate-400">
          Sistema de Preparación ACAGUE · Sesión recomendada disponible
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2">
        <div className="hidden items-center gap-2 xl:flex">

          <StatusPill tone="default" icon={<CalendarDays size={16} />}>
            {deviceStatus?.date ?? "--/--/----"}
          </StatusPill>

          <StatusPill tone="default" icon={<Clock size={16} />}>
            {deviceStatus?.time ?? "--:--:--"}
          </StatusPill>
        </div>

        <TutorButton
          variant="secondary"
          onClick={onOpenRightPanel}
          className="relative min-h-11 px-4"
          aria-label="Abrir centro TutorAcague"
        >
          <Bell size={18} />
          <span className="hidden md:inline">Centro</span>

          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border border-slate-950 bg-cyan-300 px-1 text-[10px] font-black text-slate-950">
            3
          </span>
        </TutorButton>
      </div>
    </header>
  );
}