import { CONFIDENCE_FLOOR, getConfidenceBand } from "../../config/wasteTaxonomy";

const SEGMENTS = 20;

/**
 * Model confidence, shown as a segmented bar so the value reads at a glance.
 * This is real model output. The floor marker is the backend's actual
 * threshold (ECOSCAN_CONF) - anything below it never reaches the UI.
 */
export default function ConfidenceMeter({ confidence = 0 }) {
  const pct = Math.round(confidence * 100);
  const band = getConfidenceBand(confidence);
  const filled = Math.round(confidence * SEGMENTS);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-label">AI confidence</span>
        <span className="text-2xl font-bold tabular-nums tracking-tight text-white">{pct}%</span>
      </div>

      <div
        role="meter"
        aria-label="Detection confidence"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct} percent, ${band.label}`}
        className="mt-2 flex gap-[3px]"
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className="h-2 flex-1 rounded-[2px] transition-colors duration-300"
            style={{ backgroundColor: i < filled ? band.hex : "rgba(255,255,255,.09)" }}
          />
        ))}
      </div>

      <div className="mt-2 flex items-start justify-between gap-3">
        <p className={`text-sm font-medium ${band.text}`}>{band.label}</p>
        <p className="text-xs text-slate-500">
          Floor {Math.round(CONFIDENCE_FLOOR * 100)}%
        </p>
      </div>
      {band.hint && <p className="mt-1 text-xs leading-relaxed text-slate-400">{band.hint}</p>}
    </div>
  );
}
