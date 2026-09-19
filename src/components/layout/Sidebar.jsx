import { Leaf } from "lucide-react";
import { NAV_ITEMS } from "../../config/navigation";

/** Desktop navigation rail. Hidden below lg, where MobileNav takes over. */
export default function Sidebar({ view, onNavigate, points }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/[0.06] bg-ink-900/70 backdrop-blur-xl lg:flex">
      <button
        type="button"
        onClick={() => onNavigate("home")}
        className="flex items-center gap-3 px-5 py-5 text-left"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow">
          <Leaf size={20} className="text-white" aria-hidden="true" />
        </span>
        <span className="leading-tight">
          <span className="block text-[0.9375rem] font-extrabold tracking-tight text-white">
            EcoScan AI
          </span>
          <span className="block text-[0.6875rem] text-slate-500">Vision sorting</span>
        </span>
      </button>

      <nav aria-label="Primary" className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const current = view === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onNavigate(id)}
                  aria-current={current ? "page" : undefined}
                  className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200 ${
                    current
                      ? "bg-brand-500/12 text-white"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {current && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500"
                    />
                  )}
                  <Icon
                    size={17}
                    aria-hidden="true"
                    className={current ? "text-brand-400" : ""}
                  />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        <div className="rounded-xl border border-white/[0.06] bg-ink-800/60 p-3">
          <p className="text-label">EcoPoints</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-white">{points}</p>
          <p className="mt-0.5 text-[0.6875rem] text-slate-500">Stored on this device</p>
        </div>
      </div>
    </aside>
  );
}
