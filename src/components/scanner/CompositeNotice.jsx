import { Layers, MoveRight } from "lucide-react";
import { getBin } from "../../config/wasteTaxonomy";

/**
 * "Separate before disposal" - shown when the model returns more than one
 * object in the frame and those objects map to different bins.
 *
 * This is NOT composite-material detection. The model has no such capability.
 * It reports several independent objects; comparing their rule-derived bins is
 * frontend logic, and the copy says so.
 */
export default function CompositeNotice({ detections = [] }) {
  const parts = detections.filter((d) => d?.className);
  if (parts.length < 2) return null;

  const bins = parts.map((d) => getBin(d.category));
  if (new Set(bins.map((b) => b.id)).size < 2) return null;

  return (
    <div className="animate-fade-up overflow-hidden rounded-2xl border border-pink-200 bg-pink-50">
      <div className="flex items-center gap-2 border-b border-pink-100 px-4 py-2.5">
        <Layers size={15} className="text-pink-500" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-800">Separate before disposal</p>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs leading-relaxed text-slate-500">
          Several objects are in frame and they don't share a bin. Split them first.
        </p>

        <ul className="mt-3 space-y-2">
          {parts.map((part, i) => {
            const bin = bins[i];
            const Icon = bin.icon;
            return (
              <li
                key={`${part.className}-${i}`}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                  {part.className}
                </span>
                <MoveRight size={14} className="shrink-0 text-slate-500" aria-hidden="true" />
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold ${bin.border} ${bin.surface} ${bin.text}`}
                >
                  <Icon size={12} aria-hidden="true" />
                  {bin.label}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-[0.6875rem] leading-relaxed text-slate-500">
          Based on separate detections and the configured disposal rules.
        </p>
      </div>
    </div>
  );
}
