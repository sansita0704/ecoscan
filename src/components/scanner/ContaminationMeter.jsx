import { AlertTriangle, Droplets, ShieldCheck } from "lucide-react";

/**
 * Preparation risk for the detected item.
 *
 * IMPORTANT: this is NOT computer vision. The model cannot see residue. Each
 * value is a fixed per-class constant from backend/waste_rules.py, so the UI
 * labels it as guidance rather than a measurement.
 *
 * The severity styling is derived from `score` so a high-risk item can never
 * render in a reassuring colour (broken glass scores 0.90 and must not be green).
 */
function severityFor(score, level) {
  const s = typeof score === "number" ? score : 0;
  const byLevel = String(level).toLowerCase();
  if (s >= 0.6 || byLevel === "high") {
    return { hex: "#EF4444", text: "text-danger-400", icon: AlertTriangle };
  }
  if (s >= 0.3 || byLevel === "medium") {
    return { hex: "#F59E0B", text: "text-warn-400", icon: Droplets };
  }
  return { hex: "#22C55E", text: "text-success-400", icon: ShieldCheck };
}

export default function ContaminationMeter({ level, label, score = 0 }) {
  const severity = severityFor(score, level);
  const Icon = severity.icon;
  const pct = Math.round(score * 100);
  const text = `${level} - ${label}`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-label">Preparation risk</span>
        <span className={`inline-flex items-center gap-1.5 font-semibold ${severity.text}`}>
          <Icon size={14} aria-hidden="true" />
          {text}
        </span>
      </div>

      <div
        role="meter"
        aria-label="Preparation risk"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={text}
        className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]"
      >
        <div
          className="h-full rounded-full transition-[width,background-color] duration-300"
          style={{ width: `${Math.max(4, pct)}%`, backgroundColor: severity.hex }}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[0.6875rem] text-slate-500">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>
  );
}
