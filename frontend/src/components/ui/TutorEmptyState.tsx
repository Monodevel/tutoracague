import type { ReactNode } from "react";

interface TutorEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function TutorEmptyState({
  icon,
  title,
  description,
  action,
}: TutorEmptyStateProps) {
  return (
    <div className="grid min-h-48 place-items-center rounded-[24px] border border-slate-700/50 bg-slate-950/35 p-8 text-center">
      <div className="max-w-md">
        {icon && (
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
            {icon}
          </div>
        )}

        <h2 className="text-xl font-black text-white">{title}</h2>

        {description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {description}
          </p>
        )}

        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}