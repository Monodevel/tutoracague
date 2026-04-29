import type { ReactNode } from "react";
import { cn } from "./cn";

type StatusPillTone = "default" | "ok" | "warn" | "danger" | "info";

interface StatusPillProps {
  icon?: ReactNode;
  children: ReactNode;
  tone?: StatusPillTone;
  className?: string;
}

export function StatusPill({
  icon,
  children,
  tone = "default",
  className = "",
}: StatusPillProps) {
  return (
    <div
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-2xl border px-3 py-2",
        "text-xs font-extrabold",
        tone === "default" &&
          "border-slate-700/70 bg-slate-900/70 text-slate-200",
        tone === "ok" &&
          "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
        tone === "warn" &&
          "border-amber-400/30 bg-amber-400/10 text-amber-200",
        tone === "danger" &&
          "border-red-400/30 bg-red-400/10 text-red-200",
        tone === "info" &&
          "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}