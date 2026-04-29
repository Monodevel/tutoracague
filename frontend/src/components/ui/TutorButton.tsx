import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type TutorButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface TutorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: TutorButtonVariant;
  full?: boolean;
}

export function TutorButton({
  children,
  variant = "secondary",
  full = false,
  className = "",
  disabled,
  ...props
}: TutorButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3",
        "text-sm font-black transition active:scale-[0.98]",
        "focus:outline-none focus:ring-2 focus:ring-cyan-300/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        full && "w-full",
        variant === "primary" &&
          "bg-gradient-to-br from-cyan-300 to-blue-400 text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110",
        variant === "secondary" &&
          "border border-slate-600/70 bg-slate-900/70 text-slate-100 hover:border-cyan-300/40 hover:bg-cyan-400/10",
        variant === "danger" &&
          "border border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/20",
        variant === "ghost" &&
          "bg-transparent text-slate-300 hover:bg-white/5 hover:text-white",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}