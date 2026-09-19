export default function StatTile({ icon: Icon, label, value, hint, tint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-1.5 text-label">
        {Icon && <Icon size={12} aria-hidden="true" style={tint ? { color: tint } : undefined} />}
        {label}
      </div>
      <p
        className="mt-1.5 text-lg font-bold tracking-tight text-slate-800"
        style={tint ? { color: tint } : undefined}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
