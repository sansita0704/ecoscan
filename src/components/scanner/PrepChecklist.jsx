import { useState } from "react";
import { Check } from "lucide-react";

/** Progressive preparation checklist. Steps come from the backend's rule table. */
export default function PrepChecklist({ steps }) {
  const [checked, setChecked] = useState({});
  const done = steps.filter((_, i) => checked[i]).length;
  const pct = steps.length ? (done / steps.length) * 100 : 0;
  const complete = done === steps.length && steps.length > 0;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="text-label">Before disposal</h3>
        <span
          className={`text-xs font-semibold tabular-nums ${
            complete ? "text-success-400" : "text-slate-400"
          }`}
        >
          {done}/{steps.length} done
        </span>
      </div>

      <div
        className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]"
        role="progressbar"
        aria-label="Preparation progress"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={done}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            complete ? "bg-success-500" : "bg-brand-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={`${i}-${step}`}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors ${
                checked[i]
                  ? "border-success-500/30 bg-success-500/[0.07] text-slate-400"
                  : "border-white/[0.06] bg-ink-800/50 text-slate-200 hover:border-brand-500/30 hover:bg-ink-800"
              }`}
            >
              <input
                type="checkbox"
                checked={!!checked[i]}
                onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                className="peer sr-only"
              />
              <span
                className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink-900 ${
                  checked[i]
                    ? "border-success-500 bg-success-500 text-ink-950"
                    : "border-white/25"
                }`}
              >
                {checked[i] && <Check size={13} strokeWidth={3} aria-hidden="true" />}
              </span>
              <span className={`leading-relaxed ${checked[i] ? "line-through" : ""}`}>{step}</span>
            </label>
          </li>
        ))}
      </ol>
    </div>
  );
}
