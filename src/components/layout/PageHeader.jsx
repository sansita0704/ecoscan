export default function PageHeader({ icon: Icon, eyebrow, title, subtitle, actions }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-400">
            <Icon size={20} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="text-label">{eyebrow}</p>}
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
