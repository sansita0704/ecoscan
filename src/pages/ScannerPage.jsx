import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, ImagePlus, Loader2, PackageSearch, ScanLine, Sparkles } from "lucide-react";
import AdviceList from "../components/scanner/AdviceList";
import ImageUploadPanel from "../components/scanner/ImageUploadPanel";
import LiveStream from "../components/scanner/LiveStream";
import MobileResultSheet from "../components/scanner/MobileResultSheet";
import MultiItemPanel from "../components/scanner/MultiItemPanel";
import TokenModal from "../components/scanner/TokenModal";
import TabBar from "../components/ui/TabBar";
import { ADVICE_MIN_CONFIDENCE } from "../config/constants";
import { getMaterial } from "../config/wasteTaxonomy";
import { useDetection } from "../hooks/useDetection";
import { useDisposalToken } from "../hooks/useDisposalToken";
import { useGeolocation } from "../hooks/useGeolocation";
import { useImageDetection } from "../hooks/useImageDetection";
import { playChime } from "../utils/audio";
import { grabFrame } from "../utils/frame";

const SOURCE_EMPTY_STATE = {
  live: (isLive) => ({
    icon: ScanLine,
    tone: isLive ? "tech" : "neutral",
    title: isLive ? "Searching for items" : "Scanner idle",
    body: isLive
      ? "Spread items out so each one is visible. Every item the camera confirms gets its own card here."
      : "Start the camera, then hold items in view. Each one detected gets its own card here.",
  }),
  upload: (status, error) => {
    if (status === "loading") {
      return { icon: Loader2, tone: "tech", title: "Detecting items…", spin: true, body: "Hang tight while the model looks at your photo." };
    }
    if (status === "error") {
      return {
        icon: AlertTriangle,
        tone: "danger",
        title: "Couldn't process that image",
        body: error?.message ?? "Try again from the panel on the left.",
      };
    }
    if (status === "ready") {
      return {
        icon: PackageSearch,
        tone: "warn",
        title: "No items found",
        body: "Try a closer, better-lit photo, or upload a different image.",
      };
    }
    return {
      icon: ImagePlus,
      tone: "neutral",
      title: "No image yet",
      body: "Upload a photo on the left to see items listed here.",
    };
  },
};

/**
 * Wires camera OR a single uploaded photo -> per-item classification, advice
 * and disposal tokens. Owns the <video> ref so the live detection loop and
 * the stream share one element.
 *
 * `source` picks which one feeds the shared right-hand column: "live" is the
 * original continuous camera loop (hooks/useDetection, untouched by this),
 * "upload" is a single one-shot detection on a picked photo
 * (hooks/useImageDetection) - useful when a transparent poly bag or a messy
 * pile doesn't hold still or light well enough for the live loop to read
 * cleanly. Both sides feed the exact same item cards, advice pane and QR
 * token flow, so nothing downstream needs to know which source is active.
 *
 * The right-hand column is tabbed: "Detection" lists every item found (from
 * whichever source is active), each as its own compact card; "Advice" is a
 * separate pane holding one answer per item that's been asked about,
 * independent of what's currently in view.
 */
export default function ScannerPage({ camera, muted, onToggleMute, onScan, advice }) {
  const videoRef = useRef(null);
  const captureUrlRef = useRef(null);
  const [lastCapture, setLastCapture] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState("detection");
  const [source, setSource] = useState("live");
  // Off by default: preserves the current smooth live preview. Turning it on
  // opts the live loop into the same tiled + TTA pass Upload Image always
  // uses, at the cost of a stuttering feed (see LiveStream) - that trade-off
  // belongs to the user, not something to impose silently.
  const [deepScan, setDeepScan] = useState(false);
  // Which item's card asked for the QR token, so that card alone shows the
  // spinner and the modal can be attributed back to it.
  const [tokenItem, setTokenItem] = useState(null);

  const { detection, latencyMs, error: detectionError } = useDetection(videoRef, camera.isLive, deepScan);
  const upload = useImageDetection();
  const disposal = useDisposalToken();
  const { resolve: resolveLocation } = useGeolocation();

  // Switching to "upload" stops the live camera rather than leaving it
  // running unseen in the background still hitting the detect endpoint.
  useEffect(() => {
    if (source === "upload" && camera.isLive) camera.stop();
  }, [source, camera.isLive, camera.stop]);

  // `detection.detections` / `upload.detection.detections` hold every
  // confirmed item, most prominent first (that same item is also the object
  // itself - see hooks/useDetection and hooks/useImageDetection).
  const items = source === "live" ? detection?.detections ?? [] : upload.detection?.detections ?? [];

  const emptyState =
    source === "live" ? SOURCE_EMPTY_STATE.live(camera.isLive) : SOURCE_EMPTY_STATE.upload(upload.status, upload.error);

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
      setTab("advice");
      const material = getMaterial(item.rawClass)?.id ?? null;
      const location = await resolveLocation();
      advice.request(item.trackId, item, { material, location });
    },
    [advice, resolveLocation]
  );

  const handleViewAdvice = useCallback(() => setTab("advice"), []);

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

  // Log confirmed detections to the local impact ledger. Live only, on
  // purpose: `onScan` de-duplicates on the headline item, which suits a
  // continuous stream, not a one-shot upload the user might re-run.
  useEffect(() => {
    onScan(detection);
  }, [detection, onScan]);

  // Collapse the mobile sheet once there's nothing to show on either tab.
  const hasAdvice = Object.keys(advice.byTrack).length > 0;
  useEffect(() => {
    if (!items.length && !hasAdvice) setSheetOpen(false);
  }, [items.length, hasAdvice]);

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

  const anyAdviceActive = Object.values(advice.byTrack).some(
    (a) => a.status === "loading" || a.status === "ready"
  );

  const tabs = [
    { id: "detection", label: "Detection", icon: ScanLine },
    { id: "advice", label: "Advice", icon: Sparkles, badge: anyAdviceActive },
  ];

  const sourceTabs = [
    { id: "live", label: "Live Camera", icon: Camera },
    { id: "upload", label: "Upload Image", icon: ImagePlus },
  ];

  const detectionView = (
    <MultiItemPanel
      items={items}
      emptyState={emptyState}
      getAdvice={advice.get}
      onRequestAdvice={handleRequestAdvice}
      onViewAdvice={handleViewAdvice}
      onGenerateToken={handleGenerateToken}
      tokenBusyTrackId={disposal.status === "loading" ? tokenItem?.trackId : null}
      canRequestAdvice={canRequestAdvice}
      adviceReason={adviceReason}
    />
  );

  const adviceView = <AdviceList byTrack={advice.byTrack} onRetry={advice.retry} onClear={advice.clear} />;

  const panel = (
    <>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-3">
        {tab === "detection" ? detectionView : adviceView}
      </div>
    </>
  );

  return (
    <>
      <TabBar
        tabs={sourceTabs}
        active={source}
        onChange={setSource}
        ariaLabel="Detection source"
        className="mb-4 max-w-sm"
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {source === "live" ? (
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
              deepScan={deepScan}
              onToggleDeepScan={() => setDeepScan((d) => !d)}
            />
          ) : (
            <ImageUploadPanel
              status={upload.status}
              previewUrl={upload.previewUrl}
              detection={upload.detection}
              error={upload.error}
              onSelectFile={upload.selectFile}
              onRetry={upload.retry}
              onClear={upload.clear}
            />
          )}
        </div>

        {/* Desktop: tabbed panel beside the feed. */}
        <div className="hidden lg:col-span-2 lg:block">{panel}</div>

        {/* Mobile: shown inline until there's something to put in the sheet. */}
        {!items.length && !hasAdvice && <div className="lg:hidden">{panel}</div>}

        {/* Mobile: clearance so the collapsed sheet never covers page content. */}
        {(items.length > 0 || hasAdvice) && <div aria-hidden="true" className="h-16 lg:hidden" />}
      </div>

      {/* Mobile: results become a bottom sheet over the camera. */}
      <MobileResultSheet
        open={sheetOpen}
        onToggle={() => setSheetOpen((o) => !o)}
        items={items}
        advice={advice}
        tab={tab}
      >
        {panel}
      </MobileResultSheet>

      {disposal.status === "ready" && <TokenModal token={disposal.token} onClose={handleCloseToken} />}
    </>
  );
}
