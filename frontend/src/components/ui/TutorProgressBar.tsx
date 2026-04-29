interface TutorProgressBarProps {
  value: number;
  label?: string;
}

export function TutorProgressBar({ value, label }: TutorProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="grid gap-2">
      {label && (
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span>{label}</span>
          <span>{safeValue}%</span>
        </div>
      )}

      <div className="h-3 overflow-hidden rounded-full border border-slate-700/60 bg-slate-900/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-400 transition-all duration-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}