import { getBin } from "../../config/wasteTaxonomy";

/**
 * The single loudest element in the product: which bin this goes in.
 *
 * Never relies on colour alone - the bin icon, the category label and the
 * supporting line all carry the meaning independently.
 */
export default function BinRecommendation({ category, color }) {
  const bin = getBin(category);
  const Icon = bin.icon;
  // The backend states a colour per class in bin_mapping.json; prefer it so the
  // card matches the colour of that item's box on the camera feed.
  const hex = color || bin.hex;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${bin.border} ${bin.surface} p-4`}
    >
      {/* Soft wash of the bin colour, purely decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-[0.16] blur-2xl"
        style={{ backgroundColor: hex }}
      />

      <div className="relative flex items-start gap-3.5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${hex}22`, color: hex }}
        >
          <Icon size={22} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-label">Dispose in</p>
          <p className="mt-0.5 text-lg font-bold leading-tight text-white">{bin.label}</p>
          <p className="mt-1 text-sm font-medium" style={{ color: hex }}>
            {bin.bin}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{bin.note}</p>
        </div>
      </div>
    </div>
  );
}
