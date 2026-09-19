import { BRAND, DETECTION, SUCCESS } from "../../config/constants";

/** A quiet, flat illustration for the landing page. The live scanner remains
 * functional and animated; this visual just gives the home screen a clear,
 * product-like focal point. */
export default function HeroScanVisual({ className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 440 340"
        fill="none"
        className="h-full w-full"
        role="img"
        aria-label="A camera view identifying a plastic bottle"
      >
        <rect x="18" y="18" width="404" height="304" rx="28" fill="#EAF1EB" />
        <path d="M36 246C116 205 174 266 242 222s110-16 162 18" stroke="#D5E2D7" strokeWidth="2" />
        <path d="M38 94c54-30 98 20 145-4 52-27 100-20 162 13" stroke="#D5E2D7" strokeWidth="2" />

        <rect x="72" y="48" width="296" height="240" rx="20" fill="#FFFFFF" stroke="#D9E4DB" strokeWidth="2" />
        <rect x="96" y="72" width="248" height="184" rx="14" fill="#F6F8F5" />

        <path d="M112 118h24M112 118v24M328 118h-24M328 118v24M112 210h24M112 210v-24M328 210h-24M328 210v-24" stroke={DETECTION} strokeWidth="3" strokeLinecap="round" />
        <rect x="153" y="94" width="128" height="150" rx="10" stroke={DETECTION} strokeWidth="2" strokeDasharray="5 5" />

        <path d="M185 128h48v17c0 8 10 13 10 27v46a10 10 0 0 1-10 10h-48a10 10 0 0 1-10-10v-46c0-14 10-19 10-27v-17Z" fill="#A9CBB2" />
        <rect x="193" y="114" width="32" height="16" rx="4" fill={BRAND} />
        <path d="M175 176h68" stroke="#6C9C7A" strokeWidth="3" strokeLinecap="round" />
        <path d="M185 192h48" stroke="#DCEBE0" strokeWidth="12" strokeLinecap="round" />

        <circle cx="120" cy="96" r="4" fill={SUCCESS} />
        <circle cx="322" cy="232" r="4" fill="#D27C5C" />
      </svg>

      <div className="absolute right-[10%] top-[10%] flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 shadow-card">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-slate-600">
          Item detected
        </span>
      </div>

      <div className="absolute bottom-[13%] left-1/2 w-max -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center shadow-card">
        <p className="text-sm font-bold leading-none text-slate-800">Plastic bottle</p>
        <p className="mt-1 text-[0.6875rem] font-medium text-brand-600">Rinse · Recycle</p>
      </div>
    </div>
  );
}
