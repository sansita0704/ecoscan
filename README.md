# EcoScan AI (Vision Sorting OS v2.4)

React + Vite + Tailwind + Lucide + WebRTC.

## Run
```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173  (camera needs localhost or HTTPS)
```

## Structure
```
src/
├── main.jsx / App.jsx        App shell: camera + mute state, page switching
├── config/
│   ├── wasteTaxonomy.js      material families + bin mapping (FRONTEND RULES, not model output)
│   └── env.js, constants.js, navigation.js
├── types/contracts.js        JSDoc shapes the UI expects (Detection, ...)
├── services/                 ALL backend / model access lives here
│   ├── http.js               fetch wrapper
│   ├── detectionService.js   <- plug your ML model in here
│   ├── wasteRulesService.js  the configured disposal rules, for the Waste Guide
│   ├── scanHistory.js        local scan log -> real impact figures (localStorage)
│   ├── disposalService.js    QR token + nearest hub
│   ├── ledgerService.js      community leaderboard
│   └── mockData.js           placeholder data for the no-backend demo path
├── hooks/
│   ├── useCamera.js          WebRTC getUserMedia lifecycle
│   ├── useDetection.js       frame -> model loop (no overlapping requests)
│   ├── useVideoViewport.js   maps frame coords -> element px through the cover-crop
│   ├── useScanLog.js         de-duplicated scan recording + derived stats
│   ├── useMeasuredFps.js     real FPS from the video element
│   ├── useAsyncData.js       loading/error/data for any service call
│   └── useDisposalToken.js
├── components/
│   ├── ui/                   Card, Badge, Button, StatTile, AsyncView, EmptyState, ProgressRing
│   ├── layout/               Sidebar (desktop), MobileNav (phones), Header, PageHeader
│   ├── scanner/              LiveStream, BoundingBox, DetectionResultCard, BinRecommendation,
│   │                         ConfidenceMeter, ContaminationMeter, PrepChecklist, WhyThisBin,
│   │                         CompositeNotice, MobileResultSheet, TelemetryBar, TokenModal
│   ├── illustrations/        WasteIllustration (inline SVG, one family)
│   ├── landing/              HeroScanVisual
│   ├── guide/                WasteCategoryCard
│   ├── map/                  DropoffFinder, MapCanvas
│   ├── ledger/               WeeklyActivityChart
│   └── leaderboard/          Leaderboard
├── pages/                    LandingPage, ScannerPage, WasteGuidePage, FacilitiesPage, ImpactPage
└── utils/                    frame.js (video -> Blob), boxMapping.js (overlay geometry),
                              classVoter.js (steadies flickering classifications), audio.js
```

## Disposal advice (Groq) and drop-off points (OpenStreetMap)

Three sources, kept strictly apart:

| Question | Answered by |
|---|---|
| What is this? | the YOLO model |
| What should I do with it? | a language model on Groq, via `POST /api/ai/advice` |
| Where can I take it? | OpenStreetMap, via the Overpass API |

Set `GROQ_API_KEY` in `.env` (gitignored) to enable the advice path. Groq uses
strict `json_schema` structured output, so the model must emit every required
key. Measured against this schema: `openai/gpt-oss-120b` (the default) answers
in ~3s and covers every action type; `qwen/qwen3.8-27b` works but is slower;
`openai/gpt-oss-20b` fails validation because it omits `safety`. Override with
`ADVICE_MODEL`.

`server/lib/` holds the handler; `api/ai/advice.js` is the Vercel entry point and
`server/devMiddleware.js` mounts the identical handler into the Vite dev server,
so there is one code path and no third process to run. The API key is read from
the server environment only — it is never prefixed with `VITE_`, so it cannot
reach the bundle.

Rules that keep it honest:

- The language model is sent **only** the vision model's class and confidence
  plus the rule-table values, each explicitly labelled by provenance. It is told
  the vision model cannot see condition, residue or damage, so it can't claim
  the scan observed them.
- It **never** produces facilities. Names, addresses, hours, phone numbers and
  distances come from OSM tags or are computed from OSM coordinates; anything
  OSM doesn't have is omitted rather than filled in.
- It is called **once per confirmed item**, from a button — never per frame.
- Below `ADVICE_MIN_CONFIDENCE` (default 0.5) the request short-circuits and the
  UI asks for a rescan, so a shaky class never gets confident-sounding advice.
- If it is unconfigured or fails, `server/lib/rulesFallback.js` answers from the
  existing waste rules in the same shape, tagged `source: "rules"`, and the UI
  says which path it took.

Overpass is a free, shared, slot-limited service: results are cached in-process
for 10 minutes and the whole lookup is capped by `OVERPASS_BUDGET_MS` (8s). A
slow or rate-limited lookup yields an empty list with a note — the advice still
arrives.

## What is AI, and what is a rule

The model returns exactly three things: an object **class** (one of twenty-two),
a **confidence**, and a **bounding box**. Everything else the UI shows — the
display name, the bin, the colour, the hazard flag and the prep tip — is a lookup
in `backend/bin_mapping.json` (loaded by `backend/waste_rules.py`). Bin
presentation and material families are frontend rules in
`config/wasteTaxonomy.js`.

The UI is written to keep that line visible: the "Why this bin?" panel on every
result spells out the three stages, and preparation risk is labelled as guidance
rather than something the camera detected. Please keep new UI honest the same way.

Your own impact figures come from `services/scanHistory.js`, a per-browser
localStorage log written when the detection loop confirms a new item. The
community leaderboard is sample data from the backend and is labelled as such.

## Design system

Tokens live in `tailwind.config.js`: deep navy `ink.*` surfaces, violet `brand.*`
for AI interaction, cyan `tech.*` reserved for live detection states, `success` /
`warn` / `danger` for bins, and magenta `accent.*` used sparingly. Type is Inter.
Prefer these tokens over raw Tailwind palette classes so the theme stays coherent.

## Running the backend
```bash
cd backend
python -m venv venv && venv/Scripts/activate   # source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
python main.py                                 # serves on http://127.0.0.1:8000
```
`npm run dev` proxies `/api` to that address (override with `VITE_API_PROXY`).
Check `GET /api/v1/health` to confirm the model loaded.

The backend reads these optional environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `ECOSCAN_MODEL_PATH` | auto-discovered in `backend/models/` | Checkpoint to load |
| `ECOSCAN_CONF` | `0.25` | Minimum confidence to report a detection |
| `ECOSCAN_IOU` | `0.45` | NMS IoU threshold (keeps adjacent items apart) |
| `ECOSCAN_IMGSZ` | `960` | Inference size (higher = small items survive) |
| `ECOSCAN_MAX_DET` | `40` | Cap on detections per frame |
| `ECOSCAN_DEVICE` | auto | e.g. `cpu`, `0` for the first GPU |
| `ECOSCAN_CORS_ORIGINS` | localhost + LAN | Comma-separated allowlist |

## Connecting your model and backend
The UI calls the real backend by default; set `VITE_USE_MOCK=true` in `.env` to
demo it without one. Each service has an adapter that maps your response to the
UI shape, so only that one function changes if your format differs.

| Purpose | Endpoint | Service |
|---|---|---|
| Classify a frame | `POST /api/v1/detect` (multipart `frame` JPEG) | `detectionService.detect` |
| Issue QR token | `POST /api/v1/disposal-tokens` | `disposalService.createDisposalToken` |
| Nearest hub | `GET /api/v1/hubs/nearest` | `disposalService.getNearestHub` |
| EcoPoints summary | `GET /api/v1/ledger/summary` | `ledgerService.getLedgerSummary` |
| Leaderboard | `GET /api/v1/leaderboard` | `ledgerService.getLeaderboard` |

`/detect` response. `detections` lists every item in the frame, most prominent
first, and is empty when nothing is found. `bbox` is pixel-space
`[x1, y1, x2, y2]` measured on the un-mirrored frame whose size is in `frame`:
```json
{
  "total_items": 2,
  "detections": [
    {
      "label": "plastic_bottle",
      "display_name": "Plastic Bottle",
      "confidence": 0.88,
      "bbox": [112.5, 45.0, 320.0, 410.5],
      "bin": "Dry / Recyclable",
      "color": "#3B82F6",
      "tip": "Empty liquids and crush before discarding.",
      "is_hazardous": false
    },
    {
      "label": "battery",
      "display_name": "Battery",
      "confidence": 0.41,
      "bbox": [768.0, 504.0, 844.8, 576.0],
      "bin": "Hazardous / E-Waste",
      "color": "#EF4444",
      "tip": "Fire hazard! Do NOT throw in normal bins. Take to nearest battery drop-off.",
      "is_hazardous": true
    }
  ],
  "frame": { "w": 960, "h": 720 }
}
```
`detectionService` converts each `bbox` to normalised 0..1 coordinates for the
overlay, and `detections[0]` becomes the headline item in the result panel.
"Most prominent" is not simply the top confidence: a large, centred object beats
a marginally more confident speck in a corner, since that is the item the user is
holding up to the camera.

**In-browser inference instead of HTTP:** in `detectionService.detect`, pass the
`video` element straight to ONNX Runtime Web / TensorFlow.js and map the output
through `toDetection`. Nothing else changes.

**Stability:** the model classifies every frame from scratch with no memory of
the last one, so on a live feed it flips between close classes (say
`plastic_bottle` and `glass_bottle`) from tick to tick. Showing that raw output
makes the detail panel unreadable. `utils/classVoter.js` steadies it with two
independent mechanisms:

- **Which** class shows is a vote over the last `DETECTION_VOTE_WINDOW`
  *detections*. Ticks where the model found nothing are deliberately not counted.
  A real webcam misses a third of frames, and letting misses dilute the window
  leaves a genuine item stuck just under the bar — it never appears, or an
  impostor that happens to cluster wins instead.
- **Whether** anything shows is `DETECTION_MAX_MISSES` consecutive empty ticks,
  which is the honest signal that the item has left the frame.

Thrash is prevented by requiring the leader to beat the runner-up *outright*,
not by a high threshold. With an even window two alternating classes always tie,
so neither is adopted — which is why the window must be even, and why
`DETECTION_ADOPT_VOTES` can stay low enough to react in about a second.

Measured in-browser against a simulated 65%-hit-rate feed: ~1.2s to first
result, correct label on 100% of samples, zero flips over 20s. Dropping to
window 4 / adopt 2 is ~0.35s faster at roughly double the wrong-label rate.

**Tuning** (`config/constants.js`): `DETECTION_INTERVAL_MS` sets how often frames
are sent; `BOX_SMOOTHING` and `CONFIDENCE_SMOOTHING` damp the box and the
percentage against jitter once a class is on screen.

**Overlay geometry:** the video is drawn with `object-fit: cover`, so the element
shows a centre-crop of the frame whenever the camera's aspect ratio differs from
the card's. `utils/boxMapping.js` maps normalised boxes through that crop —
treating them as plain percentages of the element puts a 4:3 webcam's boxes ~19%
of the card height off target.

## Placeholders to replace
- `QrGlyph` is a visual stand-in. Use a real QR encoder (e.g. `qrcode.react`).
- `MapCanvas` is a static mock. Swap for Leaflet/Mapbox with `hub.lat` / `hub.lng`.
- The "HEVC" label is display-only; browsers don't expose the stream codec.
- Auth, geolocation and saving captures to the backend aren't wired yet.
