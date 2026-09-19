import { useCallback, useEffect, useRef, useState } from "react";
import LiveStream from "../components/scanner/LiveStream";
import MobileResultSheet from "../components/scanner/MobileResultSheet";
import MultiItemPanel from "../components/scanner/MultiItemPanel";
import TokenModal from "../components/scanner/TokenModal";
import { ADVICE_MIN_CONFIDENCE } from "../config/constants";
import { getMaterial } from "../config/wasteTaxonomy";
import { useDetection } from "../hooks/useDetection";
import { useDisposalToken } from "../hooks/useDisposalToken";
import { useGeolocation } from "../hooks/useGeolocation";
import { playChime } from "../utils/audio";
import { grabFrame } from "../utils/frame";

/**
 * Wires camera -> detection loop -> per-item classification, advice and
 * disposal tokens. Owns the <video> ref so the detection loop and the stream
 * share one element.
 *
 * The right-hand column lists every item utils/objectTracker has confirmed in
 * the frame (see hooks/useDetection), each as its own pane via ItemCard -
 * pull several things out of one bag and each gets its own card and can be
 * asked about independently, rather than the panel only ever describing one
 * "winning" item.
 */
export default function ScannerPage({ camera, muted, onToggleMute, onScan, advice }) {
  const videoRef = useRef(null);
  const captureUrlRef = useRef(null);
  const [lastCapture, setLastCapture] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Which item's card asked for the QR token, so that card alone shows the
  // spinner and the modal can be attributed back to it.
  const [tokenItem, setTokenItem] = useState(null);

  const { detection, latencyMs, error: detectionError } = useDetection(videoRef, camera.isLive);
  const disposal = useDisposalToken();
  const { resolve: resolveLocation } = useGeolocation();

  // `detection.detections` holds every confirmed item, most prominent first
  // (that same item is also `detection` itself - see hooks/useDetection).
  const items = detection?.detections ?? [];

  const canRequestAdvice = useCallback((item) => (item?.confidence ?? 0) >= ADVICE_MIN_CONFIDENCE, []);
  const adviceReason = useCallback(
    (item) =>
      `Confidence is ${((item?.confidence ?? 0) * 100).toFixed(0)}%. Hold it steadier and better lit, then scan again for advice.`,
    []
  );

  // Advice is requested per confirmed item, never per frame. Location is
  // resolved first and passed straight through: reading it back from state in
  // the same turn would still hold the previous render's fallback coordinates.
  const handleRequestAdvice = useCallback(
    async (item) => {
      const material = getMaterial(item.rawClass)?.id ?? null;
      const location = await resolveLocation();
      advice.request(item.trackId, item, { material, location });
    },
    [advice, resolveLocation]
  );

  const handleGenerateToken = useCallback(
    (item) => {
      setTokenItem(item);
      disposal.issue(item);
    },
    [disposal]
  );

  const handleCloseToken = useCallback(() => {
    disposal.clear();
    setTokenItem(null);
  }, [disposal]);

  // Log confirmed detections to the local impact ledger. `onScan` de-duplicates
  // on the headline item, so one item held in frame counts once.
  useEffect(() => {
    onScan(detection);
  }, [detection, onScan]);

  // Collapse the mobile sheet once every item has left the frame.
  useEffect(() => {
    if (!items.length) setSheetOpen(false);
  }, [items.length]);

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

  const panel = (
    <MultiItemPanel
      items={items}
      isLive={camera.isLive}
      getAdvice={advice.get}
      onRequestAdvice={handleRequestAdvice}
      onClearAdvice={advice.clear}
      onGenerateToken={handleGenerateToken}
      tokenBusyTrackId={disposal.status === "loading" ? tokenItem?.trackId : null}
      canRequestAdvice={canRequestAdvice}
      adviceReason={adviceReason}
    />
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

        {/* Desktop: item list beside the feed. */}
        <div className="hidden lg:col-span-2 lg:block">{panel}</div>

        {/* Mobile: shown inline until there's something to put in the sheet. */}
        {!items.length && <div className="lg:hidden">{panel}</div>}

        {/* Mobile: clearance so the collapsed sheet never covers page content. */}
        {items.length > 0 && <div aria-hidden="true" className="h-16 lg:hidden" />}
      </div>

      {/* Mobile: results become a bottom sheet over the camera. */}
      <MobileResultSheet open={sheetOpen} onToggle={() => setSheetOpen((o) => !o)} items={items}>
        {panel}
      </MobileResultSheet>

      {disposal.status === "ready" && <TokenModal token={disposal.token} onClose={handleCloseToken} />}
    </>
  );
}
