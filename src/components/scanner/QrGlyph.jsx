import { useMemo } from "react";

const SIZE = 21;
const FINDERS = [
  [0, 0],
  [14, 0],
  [0, 14],
];

const inFinder = (x, y) => (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);

/**
 * Deterministic pseudo-QR, purely visual.
 * TODO: replace with a real encoder (e.g. `qrcode.react`) before production:
 *   <QRCodeSVG value={token} />
 */
export default function QrGlyph({ value }) {
  const cells = useMemo(() => {
    let h = 2166136261;
    for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const out = [];
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        if (inFinder(x, y)) continue;
        h = Math.imul(h ^ (x * 31 + y), 16777619);
        if ((h >>> 7) % 2 === 0) out.push([x, y]);
      }
    }
    return out;
  }, [value]);

  return (
    <svg
      viewBox={`-1 -1 ${SIZE + 2} ${SIZE + 2}`}
      className="h-44 w-44 rounded-xl bg-ink-950 p-1.5"
      role="img"
      aria-label="Disposal token QR code"
    >
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#fff" />
      ))}
      {FINDERS.map(([ox, oy]) => (
        <g key={`${ox}-${oy}`}>
          <rect x={ox} y={oy} width="7" height="7" fill="#fff" />
          <rect x={ox + 1} y={oy + 1} width="5" height="5" fill="#101230" />
          <rect x={ox + 2} y={oy + 2} width="3" height="3" fill="#fff" />
        </g>
      ))}
    </svg>
  );
}
