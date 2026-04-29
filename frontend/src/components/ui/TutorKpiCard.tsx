import type { ReactNode } from "react";

interface TutorKpiCardProps {
  icon?: ReactNode;
  value: string | number;
  label: string;
  description?: string;
}

export function TutorKpiCard({
  icon,
  value,
  label,
  description,
}: TutorKpiCardProps) {
  return (
    <div className="grid min-h-28 grid-cols-[56px_minmax(0,1fr)] items-center gap-4 rounded-[24px] border border-slate-700/60 bg-slate-950/50 p-4">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-3xl font-black leading-none text-white">
          {value}
        </div>
        <div className="mt-1 text-sm font-black text-slate-200">{label}</div>
        {description && (
          <div className="mt-1 text-xs text-slate-400">{description}</div>
        )}
      </div>
    </div>
  );
}