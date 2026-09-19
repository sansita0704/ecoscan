import { useState } from "react";
import { ChevronDown, Cpu, ScrollText, Sparkles } from "lucide-react";
import { getBin } from "../../config/wasteTaxonomy";

function Step({ icon: Icon, tone, title, children }) {
  return (
    <li className="flex gap-3">
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${tone}`}
      >
        <Icon size={14} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {title}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{children}</p>
      </div>
    </li>
  );
}

/**
 * Explainable AI disclosure.
 *
 * Deliberately separates the three stages so the product never implies the
 * model decided the bin. The model classifies; a rule table maps that class to
 * disposal guidance; the bin is the result of that mapping.
 */
export default function WhyThisBin({ detection }) {
  const [open, setOpen] = useState(false);
  const bin = getBin(detection.bin ?? detection.category);
  const pct = Math.round(detection.confidence * 100);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-800/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Sparkles size={15} className="text-brand-400" aria-hidden="true" />
          Why this bin?
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ol className="animate-fade-in space-y-3.5 border-t border-white/[0.06] px-4 py-4">
          <Step
            icon={Cpu}
            tone="border-tech-400/30 bg-tech-400/10 text-tech-300"
            title="1 · AI detection"
          >
            The vision model identified this object as{" "}
            <code className="rounded bg-white/[0.08] px-1 py-0.5 font-mono text-[0.8em] text-tech-300">
              {detection.rawClass ?? detection.className}
            </code>{" "}
            with {pct}% confidence, and located it in the frame.
          </Step>

          <Step
            icon={ScrollText}
            tone="border-brand-500/30 bg-brand-500/10 text-brand-400"
            title="2 · Waste rule"
          >
            A configured bin mapping (bin_mapping.json) routes that class to{" "}
            <span className="font-medium text-slate-200">{detection.bin ?? detection.category}</span>
            {detection.isHazardous ? ", flagged for hazardous handling," : ""} along with its
            preparation tip. This is a lookup, not a second prediction.
          </Step>

          <Step
            icon={bin.icon}
            tone={`${bin.border} ${bin.surface} ${bin.text}`}
            title="3 · Recommendation"
          >
            That category corresponds to the{" "}
            <span className="font-medium text-slate-200">{bin.bin}</span>. {bin.note}
          </Step>

          <li className="border-t border-white/[0.06] pt-3">
            <p className="text-xs leading-relaxed text-slate-500">
              The model reports the object class, its confidence and a bounding box. The bin, the
              hazard flag and the preparation tip are rule-based guidance rather than measurements.
            </p>
          </li>
        </ol>
      )}
    </div>
  );
}
