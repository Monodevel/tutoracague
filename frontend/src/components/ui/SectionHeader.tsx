import type { ReactNode } from "react";

interface SectionHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function SectionHeader({
  kicker,
  title,
  description,
  icon,
  action,
}: SectionHeaderProps) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
      <div className="min-w-0">
        {kicker && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
            {icon}
            {kicker}
          </div>
        )}

        <h1 className="text-3xl font-black leading-none text-white md:text-4xl">
          {title}
        </h1>

        {description && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}