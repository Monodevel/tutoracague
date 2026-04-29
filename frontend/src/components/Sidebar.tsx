import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Home,
  MapPinned,
  Settings,
  ShieldCheck,
  Target,
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const menuItems = [
  {
    id: "home",
    label: "Inicio",
    description: "Panel general",
    icon: Home,
  },
  {
    id: "study",
    label: "Estudiar",
    description: "Tutor guiado",
    icon: BookOpen,
  },
  {
    id: "practice",
    label: "Practicar",
    description: "Evaluación",
    icon: Target,
  },
  {
    id: "progress",
    label: "Progreso",
    description: "Seguimiento",
    icon: BarChart3,
  },
  {
    id: "maps",
    label: "Mapas",
    description: "Estudio visual",
    icon: MapPinned,
  },
  {
    id: "settings",
    label: "Ajustes",
    description: "Sistema",
    icon: Settings,
  },
];

export function Sidebar({
  currentPage,
  onNavigate,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  return (
    <aside
      className={[
        "grid h-screen shrink-0 grid-rows-[auto_minmax(0,1fr)_auto] border-r border-slate-800/80 bg-slate-950 py-5 transition-all duration-300",
        collapsed ? "w-[86px] px-3" : "w-[280px] px-4",
      ].join(" ")}
    >
      <div className="mb-5">
        <div
          className={[
            "flex items-center rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-3 transition-all",
            collapsed ? "justify-center" : "gap-3",
          ].join(" ")}
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
            <GraduationCap size={26} />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-lg font-black text-white">
                TutorAcague
              </div>
              <div className="truncate text-xs font-bold text-cyan-200">
                Preparación ACAGUE
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapsed}
          className={[
            "mt-3 grid h-11 place-items-center rounded-2xl border border-slate-700/70 bg-slate-900 text-slate-300 transition hover:border-cyan-300/40 hover:text-white active:scale-95",
            collapsed ? "w-full" : "w-full",
          ].join(" ")}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="min-h-0 overflow-auto pr-1">
        <div className="grid gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={[
                  "grid min-h-[64px] items-center rounded-[22px] border text-left transition active:scale-[0.98]",
                  collapsed
                    ? "grid-cols-1 justify-items-center px-2"
                    : "grid-cols-[46px_minmax(0,1fr)] gap-3 px-3",
                  active
                    ? "border-cyan-300/40 bg-cyan-400/10 text-white shadow-lg shadow-cyan-500/10"
                    : "border-transparent bg-transparent text-slate-400 hover:border-slate-700/70 hover:bg-slate-900/70 hover:text-white",
                ].join(" ")}
              >
                <div
                  className={[
                    "grid h-11 w-11 place-items-center rounded-2xl border",
                    active
                      ? "border-cyan-300/30 bg-cyan-300 text-slate-950"
                      : "border-slate-700/60 bg-slate-900 text-slate-400",
                  ].join(" ")}
                >
                  <Icon size={21} />
                </div>

                {!collapsed && (
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black">
                      {item.label}
                    </div>
                    <div
                      className={[
                        "mt-1 truncate text-xs",
                        active ? "text-cyan-100/80" : "text-slate-500",
                      ].join(" ")}
                    >
                      {item.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div
        className={[
          "mt-5 rounded-[22px] border border-slate-800 bg-slate-900/70 p-3",
          collapsed ? "grid place-items-center" : "",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-center",
            collapsed ? "justify-center" : "gap-3",
          ].join(" ")}
        >
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
            title="Modo seguro"
          >
            <ShieldCheck size={20} />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-white">
                Modo seguro
              </div>
              <div className="truncate text-xs text-slate-400">
                Contenido local validado
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}