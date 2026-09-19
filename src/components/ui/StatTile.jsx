export default function StatTile({ icon: Icon, label, value, hint, tint }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-ink-800/60 p-3">
      <div className="flex items-center gap-1.5 text-label">
        {Icon && <Icon size={12} aria-hidden="true" style={tint ? { color: tint } : undefined} />}
        {label}
      </div>
      <p
        className="mt-1.5 text-lg font-bold tracking-tight text-white"
        style={tint ? { color: tint } : undefined}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
