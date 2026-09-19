import { BRAND, DETECTION } from "../../config/constants";

/**
 * Hero illustration: a scanning viewport with waste objects orbiting it and a
 * detection label attached to the one in frame. Pure inline SVG + CSS so it
 * weighs nothing and scales cleanly.
 */
export default function HeroScanVisual({ className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 400 340" fill="none" className="h-full w-full" role="img"
        aria-label="Illustration of a camera viewport identifying a plastic bottle among other waste items">
        <defs>
          <linearGradient id="hero-screen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity="0.22" />
            <stop offset="100%" stopColor={DETECTION} stopOpacity="0.10" />
          </linearGradient>
          <linearGradient id="hero-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={DETECTION} stopOpacity="0" />
            <stop offset="50%" stopColor={DETECTION} stopOpacity="0.9" />
            <stop offset="100%" stopColor={DETECTION} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="hero-halo" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={BRAND} stopOpacity="0.32" />
            <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="200" cy="170" rx="180" ry="150" fill="url(#hero-halo)" />

        {/* orbiting items */}
        <g opacity="0.85">
          {/* can */}
          <g transform="translate(46 60)">
            <rect x="0" y="0" width="32" height="50" rx="9" fill={BRAND} fillOpacity="0.30"
              stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />
            <ellipse cx="16" cy="0" rx="16" ry="5" fill={BRAND} fillOpacity="0.5"
              stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />
          </g>
          {/* carton */}
          <g transform="translate(316 74)">
            <path d="M0 14h34v44a5 5 0 0 1-5 5H5a5 5 0 0 1-5-5V14Z" fill="#3B82F6" fillOpacity="0.32"
              stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeLinejoin="round" />
            <path d="M0 14 8 0h18l8 14" fill="#3B82F6" fillOpacity="0.2"
              stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeLinejoin="round" />
          </g>
          {/* glass */}
          <g transform="translate(40 226)">
            <path d="M6 0h18v14c0 6 9 10 9 20v26a8 8 0 0 1-8 8H5a8 8 0 0 1-8-8V34c0-10 9-14 9-20V0Z"
              fill={DETECTION} fillOpacity="0.26" stroke="#fff" strokeOpacity="0.5" strokeWidth="2"
              strokeLinejoin="round" />
          </g>
          {/* cup */}
          <g transform="translate(320 222)">
            <path d="M0 6h40l-7 54a7 7 0 0 1-7 6H14a7 7 0 0 1-7-6L0 6Z" fill="#EC4899" fillOpacity="0.26"
              stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeLinejoin="round" />
            <rect x="-3" y="-2" width="46" height="9" rx="3" fill="#EC4899" fillOpacity="0.4"
              stroke="#fff" strokeOpacity="0.5" strokeWidth="2" />
          </g>
        </g>

        {/* viewport */}
        <rect x="118" y="72" width="164" height="196" rx="26" fill="url(#hero-screen)"
          stroke="#fff" strokeOpacity="0.16" strokeWidth="2" />

        {/* bottle in frame */}
        <g transform="translate(168 108)">
          <path d="M14 18h36v14c0 8 12 13 12 28v54a12 12 0 0 1-12 12H14A12 12 0 0 1 2 114V60c0-15 12-20 12-28V18Z"
            fill={BRAND} fillOpacity="0.5" stroke="#fff" strokeOpacity="0.85" strokeWidth="2.6"
            strokeLinejoin="round" />
          <rect x="20" y="0" width="24" height="18" rx="4" fill={BRAND} fillOpacity="0.7"
            stroke="#fff" strokeOpacity="0.85" strokeWidth="2.6" />
          <path d="M2 76h60" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.4" strokeLinecap="round" />
        </g>

        {/* detection box + corners */}
        <rect x="152" y="98" width="96" height="140" rx="8" stroke={DETECTION} strokeWidth="2.5" />
        {[[152, 98, 1, 1], [248, 98, -1, 1], [152, 238, 1, -1], [248, 238, -1, -1]].map(([x, y, sx, sy]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y + 16 * sy} L${x} ${y} L${x + 16 * sx} ${y}`}
            stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        ))}

        {/* scan sweep */}
        <rect x="120" y="166" width="160" height="3" fill="url(#hero-sweep)">
          <animate attributeName="y" values="96;238;96" dur="3.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" dur="3.2s" repeatCount="indefinite" />
        </rect>
      </svg>

      {/* detection label, as real HTML so it uses the product's type */}
      <div className="absolute left-1/2 top-[7%] -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-xl border border-tech-400/40 bg-ink-950/85 px-3 py-1.5 shadow-glow-tech backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-tech-400" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-tech-400" />
          </span>
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-tech-300">
            AI detected
          </span>
        </div>
      </div>

      <div className="absolute bottom-[12%] left-1/2 w-max -translate-x-1/2">
        <div className="rounded-xl border border-white/10 bg-ink-950/85 px-3.5 py-2 text-center backdrop-blur-sm">
          <p className="text-sm font-bold leading-none text-white">PET Plastic Bottle</p>
          <p className="mt-1 text-[0.6875rem] font-medium text-success-400">Dry / Recyclable</p>
        </div>
      </div>
    </div>
  );
}
