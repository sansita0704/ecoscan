import { ChevronUp, X } from "lucide-react";
import { getBin } from "../../config/wasteTaxonomy";

/**
 * What the collapsed peek should say: the most prominent item, and how many
 * others are alongside it.
 */
function peekFor(items) {
  if (!items.length) return null;
  const [primary, ...rest] = items;
  const bin = getBin(primary.bin ?? primary.category);
  return {
    icon: bin.icon,
    hex: primary.color || bin.hex,
    title: primary.className,
    subtitle: rest.length ? `${bin.label} · +${rest.length} more item${rest.length === 1 ? "" : "s"}` : bin.label,
  };
}

/**
 * Mobile-only bottom sheet for the detection results.
 *
 * Collapsed it peeks above the tab bar with just the headline item and how
 * many others are with it, so the camera keeps the screen. Expanded it covers
 * the tab bar and scrolls the full list of item panes.
 */
export default function MobileResultSheet({ open, onToggle, items, children }) {
  const peek = peekFor(items);
  if (!peek) return null;
  const PeekIcon = peek.icon;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close results"
          className="fixed inset-0 z-[55] bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      <div
        className={`fixed inset-x-0 lg:hidden ${
          open
            ? // Sits above the tab bar: it's modal, with a backdrop and a close control.
              "bottom-0 top-[10vh] z-[60]"
            : "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30"
        }`}
      >
        <div className="flex h-full flex-col rounded-t-3xl border-t border-slate-200 bg-white shadow-[0_-16px_48px_-16px_rgba(0,0,0,.12)]">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="relative flex shrink-0 items-center gap-3 rounded-t-3xl px-4 pb-3 pt-4 text-left"
          >
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1.5 h-1 w-9 -translate-x-1/2 rounded-full bg-slate-200"
            />

            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${peek.hex}22`, color: peek.hex }}
            >
              <PeekIcon size={18} aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-800">{peek.title}</span>
              <span className="block truncate text-xs font-medium" style={{ color: peek.hex }}>
                {peek.subtitle}
              </span>
            </span>

            <span className="shrink-0 text-slate-400">
              {open ? <X size={18} aria-hidden="true" /> : <ChevronUp size={18} aria-hidden="true" />}
            </span>
            <span className="sr-only">{open ? "Collapse results" : "Expand results"}</span>
          </button>

          {open && (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
              {children}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
