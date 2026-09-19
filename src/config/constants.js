// Semantic colours for SVG/canvas work, where Tailwind classes don't reach.
// Keep in step with tailwind.config.js.
export const BRAND = "#477A5C"; // muted green - primary product interaction
export const DETECTION = "#3B82F6"; // blue - live detection / technology
export const SUCCESS = "#22C55E"; // green - recyclable / success

export const LOCATION_LABEL = "Jaipur, IN";

// Used for the facility search until the user grants precise location. The UI
// always states which of the two is in play.
export const FALLBACK_LOCATION = { lat: 26.9124, lon: 75.7873, label: LOCATION_LABEL };

// App policy: below this the UI asks for a rescan instead of requesting advice.
// Kept in step with ADVICE_MIN_CONFIDENCE on the server, which is authoritative.
// This is NOT the model's own floor (that is ECOSCAN_CONF, default 0.35).
export const ADVICE_MIN_CONFIDENCE = 0.5;

// How often a frame is sent to the model (ms). Requests never overlap: the next
// one is scheduled only after the previous finishes, so the real cadence is this
// plus inference time (~60-140ms on CPU).
export const DETECTION_INTERVAL_MS = 150;

// How many recent ticks are considered when deciding what to display. A class
// must win a majority of this window to appear (or to stay shown), which is
// what keeps a single flickered misclassification from swapping the panel.
// Larger = steadier but slower to react; smaller = snappier but jitterier.
// How many recent DETECTIONS are considered (ticks that found nothing are not
// counted - see utils/classVoter). Must be EVEN: that is what makes two
// alternating classes tie, so neither is adopted and the panel holds still.
export const DETECTION_VOTE_WINDOW = 6;

// Detections a class needs to take over the panel. It must also beat the
// runner-up outright, which is what prevents thrash - so this can stay low and
// the reading appears in about a second rather than a couple of seconds.
// Measured over simulated streams: 6/3 shows the correct label ~97% of ticks on
// a handheld webcam vs ~96% for 4/2, with roughly half the wrong-label flashes.
// Drop to 4/2 if you want it ~0.35s snappier and can accept that.
export const DETECTION_ADOPT_VOTES = 3;

// Detections the class already on screen needs to stay there. Deliberately
// lower than the adopt bar: a noisy stretch should not blank the panel out,
// since a reading that keeps vanishing is as unreadable as one that keeps
// changing.
export const DETECTION_KEEP_VOTES = 1;

// Consecutive empty ticks before the panel clears. This - not the vote - is
// what decides that the item has actually left the frame.
export const DETECTION_MAX_MISSES = 5;

// Weight of the newest reading in the box/confidence smoothing average (0..1),
// applied only while the same class keeps winning. Lower = steadier but
// laggier; higher = snappier but jitterier.
export const BOX_SMOOTHING = 0.45;
export const CONFIDENCE_SMOOTHING = 0.35;

// Consecutive failed requests before the stale reading is cleared off the feed.
export const MAX_CONSECUTIVE_ERRORS = 3;

// Display-only. Browsers don't expose the codec of a getUserMedia stream.
export const STREAM_CODEC_LABEL = "HEVC";

export const CAMERA_CONSTRAINTS = {
  video: {
    facingMode: "user",
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 60 },
  },
  audio: false,
};

export const CAMERA_MESSAGES = {
  idle: { title: "Camera is off", body: "Launch the webcam to start scanning items in real time." },
  starting: { title: "Starting camera…", body: "Waiting for camera access." },
  denied: {
    title: "Camera access blocked",
    body: "Allow camera permission in your browser's site settings, then launch again.",
  },
  error: {
    title: "Camera unavailable",
    body: "No camera was found, or another app is using it. Check the connection and retry.",
  },
  unsupported: {
    title: "Camera not supported",
    body: "This browser can't access a webcam. Use a current browser over HTTPS.",
  },
};
