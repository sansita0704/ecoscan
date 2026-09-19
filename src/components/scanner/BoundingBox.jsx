import { DETECTION } from "../../config/constants";
import { mapBoxToViewport } from "../../utils/boxMapping";

const CORNERS = [
  "left-0 top-0 border-l-2 border-t-2 rounded-tl-md",
  "right-0 top-0 border-r-2 border-t-2 rounded-tr-md",
  "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-md",
  "right-0 bottom-0 border-r-2 border-b-2 rounded-br-md",
];

function Box({ rect, label, confidence, primary }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-lg transition-[left,top,width,height] duration-150 ease-out ${
        primary ? "animate-fade-in" : ""
      }`}
      style={{
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        border: primary ? `2px solid ${DETECTION}` : `1px solid ${DETECTION}70`,
        boxShadow: primary ? `0 0 28px -4px ${DETECTION}66, inset 0 0 22px -12px ${DETECTION}` : "none",
      }}
    >
      <span
        className={`absolute -left-0.5 whitespace-nowrap rounded-md font-semibold text-ink-950 ${
          primary ? "-top-7 px-2 py-1 text-xs" : "-top-5 px-1.5 py-0.5 text-[10px]"
        }`}
        style={{ backgroundColor: primary ? DETECTION : `${DETECTION}B3` }}
      >
        {label} {(confidence * 100).toFixed(0)}%
      </span>
      {primary &&
        CORNERS.map((c) => (
          <span key={c} className={`absolute h-3.5 w-3.5 border-white/90 ${c}`} />
        ))}
    </div>
  );
}

/**
 * Draws the primary detection plus any secondary ones over the video.
 * Renders nothing until the viewport mapping is known.
 */
export default function BoundingBox({ detection, mirrored = false, viewport }) {
  if (!detection?.box || !viewport) return null;

  const secondary = (detection.detections ?? []).slice(1).filter((d) => d?.box);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {secondary.map((d, i) => (
        <Box
          key={`${d.className}-${i}`}
          rect={mapBoxToViewport(d.box, viewport, mirrored)}
          label={d.className}
          confidence={d.confidence}
          primary={false}
        />
      ))}
      <Box
        rect={mapBoxToViewport(detection.box, viewport, mirrored)}
        label={detection.className}
        confidence={detection.confidence}
        primary
      />
    </div>
  );
}
