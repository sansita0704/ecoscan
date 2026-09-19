import { useEffect, useRef, useState } from "react";
import { Aperture, Camera, CameraOff, ScanLine, Volume2, VolumeX } from "lucide-react";
import { useMeasuredFps } from "../../hooks/useMeasuredFps";
import { useVideoViewport } from "../../hooks/useVideoViewport";
import ActionButton from "../ui/ActionButton";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import BoundingBox from "./BoundingBox";
import CameraPlaceholder from "./CameraPlaceholder";
import TelemetryBar from "./TelemetryBar";

/** Corner reticle marking the scan area. Decorative; fades once something is found. */
function Reticle({ dimmed }) {
  const corners = [
    "left-6 top-6 border-l-2 border-t-2 rounded-tl-xl",
    "right-6 top-6 border-r-2 border-t-2 rounded-tr-xl",
    "left-6 bottom-6 border-l-2 border-b-2 rounded-bl-xl",
    "right-6 bottom-6 border-r-2 border-b-2 rounded-br-xl",
  ];
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
        dimmed ? "opacity-0" : "opacity-100"
      }`}
    >
      {corners.map((c) => (
        <span key={c} className={`absolute h-8 w-8 border-white/25 ${c}`} />
      ))}
    </div>
  );
}

/**
 * Presentational stream card. The parent owns `videoRef` (so the detection loop
 * can read frames from it) and all data; this component only attaches the
 * MediaStream and renders overlays.
 */
export default function LiveStream({
  videoRef,
  camera,
  detection,
  detectionError,
  latencyMs,
  muted,
  onToggleMute,
  onCapture,
  lastCapture,
}) {
  const [mirrored, setMirrored] = useState(true);
  const containerRef = useRef(null);
  const { stream, status, isLive, settings } = camera;
  const fps = useMeasuredFps(videoRef, isLive) || Math.round(settings?.frameRate ?? 0);
  const viewport = useVideoViewport(videoRef, containerRef, isLive);

  // Attach (or detach) the MediaStream whenever it changes.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) video.play().catch(() => {});
  }, [stream, videoRef]);

  return (
    <Card className="overflow-hidden">
      {/* Taller on phones so the feed owns the screen; 16:9 from sm upward. */}
      <div
        ref={containerRef}
        className="relative aspect-[3/4] w-full overflow-hidden bg-ink-950 sm:aspect-video"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Live camera feed"
          className={`h-full w-full object-cover ${isLive ? "" : "invisible"}`}
          style={{ transform: mirrored ? "scaleX(-1)" : "none" }}
        />

        {!isLive && <CameraPlaceholder status={status} onStart={camera.start} />}

        {isLive && (
          <>
            {/* Scanning sweep - only while nothing is confirmed, so it reads as
                "looking" rather than as permanent decoration. */}
            {!detection && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="h-1 w-full animate-scanline bg-gradient-to-r from-transparent via-tech-400 to-transparent opacity-70 shadow-glow-tech" />
              </div>
            )}

            <Reticle dimmed={!!detection} />

            <div className="absolute left-4 top-4 flex items-center gap-2">
              <Badge tone="red" className="!border-danger-500/40 !bg-ink-950/70 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-danger-400" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-danger-500" />
                </span>
                LIVE
              </Badge>
            </div>

            <div className="absolute right-4 top-4">
              {detectionError ? (
                <Badge tone="red" className="!bg-ink-950/70 backdrop-blur-sm">
                  Model unreachable
                </Badge>
              ) : (
                <Badge
                  tone={detection ? "tech" : "zinc"}
                  className="!bg-ink-950/70 backdrop-blur-sm"
                >
                  <ScanLine size={12} aria-hidden="true" />
                  {detection ? "Detecting" : "Searching"}
                </Badge>
              )}
            </div>

            <BoundingBox detection={detection} mirrored={mirrored} viewport={viewport} />
          </>
        )}

        {/* Only meaningful once the stream is running, and it would otherwise
            overlap the placeholder's call to action on short screens. */}
        {isLive && (
          <TelemetryBar
            isLive={isLive}
            fps={fps}
            latencyMs={latencyMs}
            height={settings?.height}
            mirrored={mirrored}
            onToggleMirror={() => setMirrored((m) => !m)}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 border-t border-white/[0.06] p-4">
        <ActionButton
          icon={isLive ? CameraOff : Camera}
          label={isLive ? "Stop camera" : "Start camera"}
          onClick={camera.toggle}
          active={isLive}
        />
        <ActionButton
          icon={Aperture}
          label="Capture frame"
          onClick={() => onCapture(mirrored)}
          disabled={!isLive}
        />
        <ActionButton
          icon={muted ? VolumeX : Volume2}
          label={muted ? "Alerts muted" : "Mute alerts"}
          onClick={onToggleMute}
          active={muted}
        />
        {lastCapture && (
          <div className="ml-auto flex items-center gap-2">
            <img
              src={lastCapture}
              alt="Most recent captured frame"
              className="h-10 w-16 rounded-lg border border-white/10 object-cover"
            />
            <span className="text-xs text-slate-500">Frame saved</span>
          </div>
        )}
      </div>
    </Card>
  );
}
