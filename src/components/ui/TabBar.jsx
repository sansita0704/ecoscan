/**
 * Segmented tab strip.
 *
 * `tabs`: [{ id, label, icon?, badge? }]. `badge` renders a small dot, used to
 * flag a tab that has new content while the user is looking at another one.
 */
export default function TabBar({ tabs, active, onChange, className = "" }) {
  return (
    <div
      role="tablist"
      aria-label="Result view"
      className={`flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 ${className}`}
    >
      {tabs.map(({ id, label, icon: Icon, badge, disabled }) => {
        const current = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={current}
            aria-controls={`panel-${id}`}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
              current
                ? "bg-white text-brand-600 shadow-sm"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
            }`}
          >
            {Icon && (
              <Icon size={15} aria-hidden="true" className={current ? "text-brand-500" : ""} />
            )}
            {label}
            {badge && !current && (
              <span
                aria-label="new"
                className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-accent-500"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
