const TONES = {
  brand: "border-brand-500/35 bg-brand-500/12 text-brand-400",
  tech: "border-tech-400/35 bg-tech-400/12 text-tech-300",
  green: "border-success-500/35 bg-success-500/12 text-success-400",
  warn: "border-warn-500/35 bg-warn-500/12 text-warn-400",
  red: "border-danger-500/35 bg-danger-500/12 text-danger-400",
  accent: "border-accent-500/35 bg-accent-500/12 text-accent-400",
  zinc: "border-white/10 bg-white/[0.06] text-slate-300",
};

export default function Badge({ children, tone = "green", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
