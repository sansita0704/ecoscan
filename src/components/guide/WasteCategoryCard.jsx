import { ArrowRight } from "lucide-react";
import { getBin } from "../../config/wasteTaxonomy";
import WasteIllustration from "../illustrations/WasteIllustration";
import Card from "../ui/Card";

/**
 * One material family. `count` is the real number of times this browser has
 * scanned something in the family, so an unused install honestly shows zero.
 */
export default function WasteCategoryCard({ material, count = 0, expanded, onToggle, ruleFor }) {
  const panelId = `guide-${material.id}`;

  return (
    <Card interactive className="group overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="w-full rounded-2xl p-5 text-left"
      >
        <div className="flex items-start gap-4">
          <WasteIllustration
            id={material.id}
            tint={material.tint}
            className="h-20 w-20 shrink-0 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold leading-tight text-white">{material.name}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{material.blurb}</p>
            <p className="mt-3 text-sm">
              <span className="font-bold tabular-nums text-white">{count}</span>{" "}
              <span className="text-slate-500">
                {count === 1 ? "item scanned" : "items scanned"}
              </span>
            </p>
          </div>
        </div>

        <span
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          style={{ color: material.tint }}
        >
          {expanded ? "Hide items" : "Explore"}
          <ArrowRight
            size={14}
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </span>
      </button>

      {expanded && (
        <ul id={panelId} className="animate-fade-in space-y-2 border-t border-white/[0.06] p-4">
          {material.classes.map((className) => {
            const rule = ruleFor(className);
            const bin = getBin(rule?.bin);
            const Icon = bin.icon;
            return (
              <li
                key={className}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-ink-800/50 px-3 py-2.5"
              >
                <span className="min-w-0 truncate text-sm text-slate-200">
                  {rule?.display_name ?? className}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 text-[0.6875rem] font-semibold ${bin.border} ${bin.surface} ${bin.text}`}
                >
                  <Icon size={11} aria-hidden="true" />
                  {bin.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
