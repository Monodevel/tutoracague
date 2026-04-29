import type { ReactNode } from "react";
import { cn } from "./cn";

interface TutorCardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export function TutorCard({
  children,
  className = "",
  padded = true,
}: TutorCardProps) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-slate-700/60 bg-slate-950/55 shadow-2xl shadow-black/20 backdrop-blur-xl",
        "min-w-0 min-h-0",
        padded && "p-5",
        className
      )}
    >
      {children}
    </section>
  );
}