import { FlipHorizontal } from "lucide-react";
import { STREAM_CODEC_LABEL } from "../../config/constants";

function Reading({ label, value }) {
  return (
    <span className="text-slate-400">
      {label} <b className="font-semibold text-tech-300">{value}</b>
    </span>
  );
}

export default function TelemetryBar({ isLive, fps, latencyMs, height, mirrored, onToggleMirror }) {
  const dash = "—";
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink-950 via-ink-950/75 to-transparent px-4 pb-3 pt-12 font-mono text-[0.6875rem]">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Reading label="FPS" value={isLive && fps ? fps : dash} />
        <Reading label="LATENCY" value={isLive && latencyMs != null ? `${latencyMs}ms` : dash} />
        <Reading label="STREAM" value={isLive && height ? `${height}p ${STREAM_CODEC_LABEL}` : dash} />
      </div>
      <button
        type="button"
        onClick={onToggleMirror}
        aria-pressed={mirrored}
        aria-label="Flip video horizontally"
        className={`pointer-events-auto rounded-lg border p-1.5 transition-colors ${
          mirrored
            ? "border-tech-400/40 bg-tech-400/10 text-tech-300"
            : "border-white/10 text-slate-400 hover:border-white/25 hover:text-white"
        }`}
      >
        <FlipHorizontal size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
