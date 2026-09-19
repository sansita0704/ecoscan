const TONES = {
  brand: "border-brand-200 bg-brand-50 text-brand-600",
  tech: "border-cyan-200 bg-cyan-50 text-cyan-600",
  green: "border-success-200 bg-success-50 text-success-600",
  warn: "border-warn-200 bg-amber-50 text-amber-600",
  red: "border-danger-200 bg-red-50 text-danger-500",
  accent: "border-pink-200 bg-pink-50 text-pink-600",
  zinc: "border-slate-200 bg-slate-100 text-slate-600",
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
