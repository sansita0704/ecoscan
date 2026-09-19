import { MOBILE_NAV_ITEMS } from "../../config/navigation";

/** Bottom tab bar on phones/tablets. Hidden at lg, where the sidebar takes over. */
export default function MobileNav({ view, onNavigate }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/90 bg-white/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {MOBILE_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const current = view === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={current ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-1 px-1 py-2.5 text-[0.625rem] font-semibold transition-colors ${
                  current ? "text-brand-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-lg transition-colors ${
                    current ? "bg-brand-100/70" : ""
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
