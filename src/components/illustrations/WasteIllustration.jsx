/**
 * Waste-category illustrations.
 *
 * One family, one grid (0 0 120 120), one construction: soft tinted backdrop,
 * rounded vector shapes, a single highlight stroke. Inline SVG rather than
 * image files so they inherit the category tint, stay crisp at any size and
 * cost nothing to download.
 *
 * Only the categories the model can actually produce are drawn here.
 */

function Frame({ tint, children, ...rest }) {
  const id = `g-${tint.replace("#", "")}`;
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" {...rest}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tint} stopOpacity="0.30" />
          <stop offset="100%" stopColor={tint} stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="108" height="108" rx="30" fill={`url(#${id})`} />
      <rect
        x="6.5"
        y="6.5"
        width="107"
        height="107"
        rx="29.5"
        stroke={tint}
        strokeOpacity="0.28"
      />
      {children}
    </svg>
  );
}

const S = { stroke: "#fff", strokeOpacity: 0.9, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };

function Plastic({ tint, ...rest }) {
  return (
    <Frame tint={tint} {...rest}>
      {/* bottle */}
      <path
        d="M52 34h16v8c0 4 6 7 6 14v28a8 8 0 0 1-8 8H54a8 8 0 0 1-8-8V56c0-7 6-10 6-14v-8Z"
        fill={tint}
        fillOpacity="0.55"
        {...S}
      />
      <path d="M54 28h12v6H54z" fill={tint} {...S} />
      <path d="M47 66h26" {...S} strokeOpacity="0.55" />
      {/* cap */}
      <circle cx="88" cy="82" r="9" fill={tint} fillOpacity="0.4" {...S} />
      <path d="M88 76v12" {...S} strokeOpacity="0.5" />
    </Frame>
  );
}

function Paper({ tint, ...rest }) {
  return (
    <Frame tint={tint} {...rest}>
      {/* carton */}
      <path d="M40 46h30v42a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6V46Z" fill={tint} fillOpacity="0.5" {...S} />
      <path d="M40 46l7.5-14h15L70 46" fill={tint} fillOpacity="0.3" {...S} />
      <path d="M55 32v14" {...S} strokeOpacity="0.5" />
      {/* cup */}
      <path d="M76 56h22l-4 34a6 6 0 0 1-6 5h-2a6 6 0 0 1-6-5l-4-34Z" fill={tint} fillOpacity="0.35" {...S} />
      <path d="M74 50h26v6H74z" fill={tint} fillOpacity="0.55" {...S} />
    </Frame>
  );
}

function Glass({ tint, ...rest }) {
  return (
    <Frame tint={tint} {...rest}>
      <path
        d="M48 30h14v12c0 5 8 9 8 18v30a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V60c0-9 8-13 8-18V30Z"
        fill={tint}
        fillOpacity="0.45"
        {...S}
      />
      <path d="M40 70h30" {...S} strokeOpacity="0.5" />
      {/* shards, safely abstract */}
      <path d="M82 88l8-18 8 18-8 6-8-6Z" fill={tint} fillOpacity="0.4" {...S} />
      <path d="M84 56l7 8" {...S} strokeOpacity="0.55" />
    </Frame>
  );
}

function Metal({ tint, ...rest }) {
  return (
    <Frame tint={tint} {...rest}>
      <rect x="42" y="34" width="34" height="56" rx="10" fill={tint} fillOpacity="0.5" {...S} />
      <path d="M42 46h34M42 78h34" {...S} strokeOpacity="0.5" />
      <ellipse cx="59" cy="34" rx="17" ry="6" fill={tint} fillOpacity="0.7" {...S} />
      {/* pull tab: a ring on a small tongue */}
      <rect x="84" y="74" width="20" height="9" rx="4.5" fill={tint} fillOpacity="0.5" {...S} />
      <circle cx="94" cy="62" r="10" fill="none" {...S} />
      <circle cx="94" cy="62" r="4" fill={tint} fillOpacity="0.35" {...S} />
    </Frame>
  );
}

function Hazardous({ tint, ...rest }) {
  return (
    <Frame tint={tint} {...rest}>
      <path d="M60 32l32 56H28l32-56Z" fill={tint} fillOpacity="0.45" {...S} />
      <path d="M60 52v18" {...S} />
      <circle cx="60" cy="78" r="2.6" fill="#fff" fillOpacity="0.9" />
    </Frame>
  );
}

const BY_ID = {
  plastic: Plastic,
  paper: Paper,
  glass: Glass,
  metal: Metal,
  hazardous: Hazardous,
};

export default function WasteIllustration({ id, tint = "#8B5CF6", className = "" }) {
  const Art = BY_ID[id];
  if (!Art) return null;
  return <Art tint={tint} className={className} />;
}
