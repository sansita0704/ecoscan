import { useCallback, useEffect, useRef, useState } from "react";
import { ScanLine, Sparkles } from "lucide-react";
import AdvicePanel from "../components/scanner/AdvicePanel";
import DetectionResultCard from "../components/scanner/DetectionResultCard";
import LiveStream from "../components/scanner/LiveStream";
import MobileResultSheet from "../components/scanner/MobileResultSheet";
import TokenModal from "../components/scanner/TokenModal";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import TabBar from "../components/ui/TabBar";
import { ADVICE_MIN_CONFIDENCE } from "../config/constants";
import { getMaterial } from "../config/wasteTaxonomy";
import { useDetection } from "../hooks/useDetection";
import { useDisposalToken } from "../hooks/useDisposalToken";
import { useGeolocation } from "../hooks/useGeolocation";
import { playChime } from "../utils/audio";
import { grabFrame } from "../utils/frame";

/**
 * Wires camera -> detection loop -> classification, advice and disposal token.
 * Owns the <video> ref so the detection hook and the stream share one element.
 *
 * The right-hand column is tabbed. "Detection" tracks the live feed and empties
 * when the item leaves frame; "Advice" holds whatever the user last asked about
 * and stays put regardless of what the camera is doing.
 */
export default function ScannerPage({ camera, muted, onToggleMute, onScan, advice }) {
  const videoRef = useRef(null);
  const captureUrlRef = useRef(null);
  const [lastCapture, setLastCapture] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState("detection");

  const { detection, latencyMs, error: detectionError } = useDetection(videoRef, camera.isLive);
  const disposal = useDisposalToken(detection);
  const { resolve: resolveLocation } = useGeolocation();

  const material = detection ? getMaterial(detection.rawClass)?.id ?? null : null;

  // Advice is requested per confirmed item, never per frame. Location is
  // resolved first and passed straight through: reading it back from state in
  // the same turn would still hold the previous render's fallback coordinates.
  const { request: requestAdvice } = advice;
  const handleRequestAdvice = useCallback(async () => {
    if (!detection) return;
    setTab("advice");
    const location = await resolveLocation();
    requestAdvice(detection, { material, location });
  }, [detection, material, resolveLocation, requestAdvice]);

  // Log confirmed detections to the local impact ledger. `onScan` de-duplicates,
  // so one item held in frame counts once.
  useEffect(() => {
    onScan(detection);
  }, [detection, onScan]);

  // Collapse the mobile sheet when the item leaves the frame, unless the user
  // is reading advice - that outlives the detection by design.
  useEffect(() => {
    if (!detection && tab === "detection") setSheetOpen(false);
  }, [detection, tab]);

  const handleCapture = useCallback(
    async (mirrored) => {
      const blob = await grabFrame(videoRef.current, { mirror: mirrored });
      if (!blob) return;
      if (captureUrlRef.current) URL.revokeObjectURL(captureUrlRef.current);
      captureUrlRef.current = URL.createObjectURL(blob);
      setLastCapture(captureUrlRef.current);
      if (!muted) playChime();
    },
    [muted]
  );

  useEffect(
    () => () => {
      if (captureUrlRef.current) URL.revokeObjectURL(captureUrlRef.current);
    },
    []
  );

  const confident = (detection?.confidence ?? 0) >= ADVICE_MIN_CONFIDENCE;
  const adviceReason = !detection
    ? "Point the camera at an item first, then ask for advice."
    : `Confidence is ${((detection.confidence ?? 0) * 100).toFixed(0)}%. Hold the item steadier and better lit, then scan again for advice.`;

  const tabs = [
    { id: "detection", label: "Detection", icon: ScanLine },
    {
      id: "advice",
      label: "Advice",
      icon: Sparkles,
      badge: advice.status === "ready" || advice.status === "loading",
    },
  ];

  const detectionView = (
    <DetectionResultCard
      detection={detection}
      isLive={camera.isLive}
      tokenStatus={disposal.status}
      tokenError={disposal.error}
      onGenerateToken={disposal.issue}
    />
  );

  const adviceView =
    advice.status === "idle" && !detection ? (
      <Card>
        <EmptyState
          icon={Sparkles}
          tone="brand"
          title="No advice yet"
          body="Scan an item, then ask for advice. It stays here while you keep scanning."
        />
      </Card>
    ) : (
      <AdvicePanel
        status={advice.status}
        advice={advice.advice}
        error={advice.error}
        subject={advice.subject}
        onRequest={handleRequestAdvice}
        onRetry={handleRequestAdvice}
        onClear={advice.clear}
        canRequest={confident}
        reason={adviceReason}
      />
    );

  const panel = (
    <>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="mt-3"
      >
        {tab === "detection" ? detectionView : adviceView}
      </div>
    </>
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <LiveStream
            videoRef={videoRef}
            camera={camera}
            detection={detection}
            detectionError={detectionError}
            latencyMs={latencyMs}
            muted={muted}
            onToggleMute={onToggleMute}
            onCapture={handleCapture}
            lastCapture={lastCapture}
          />
        </div>

        {/* Desktop: tabbed panel beside the feed. */}
        <div className="hidden lg:col-span-2 lg:block">{panel}</div>

        {/* Mobile: shown inline until there's something to put in the sheet. */}
        {!detection && advice.status === "idle" && <div className="lg:hidden">{panel}</div>}

        {/* Mobile: clearance so the collapsed sheet never covers page content. */}
        {(detection || advice.status !== "idle") && (
          <div aria-hidden="true" className="h-16 lg:hidden" />
        )}
      </div>

      {/* Mobile: a result becomes a bottom sheet over the camera. */}
      <MobileResultSheet
        open={sheetOpen}
        onToggle={() => setSheetOpen((o) => !o)}
        detection={detection}
        advice={advice}
        tab={tab}
      >
        {panel}
      </MobileResultSheet>

      {disposal.status === "ready" && <TokenModal token={disposal.token} onClose={disposal.clear} />}
    </>
  );
}
