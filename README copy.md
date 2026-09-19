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
├── config/                   env.js, constants.js, navigation.js
├── types/contracts.js        JSDoc shapes the UI expects (Detection, LedgerSummary, ...)
├── services/                 ALL backend / model access lives here
│   ├── http.js               fetch wrapper
│   ├── detectionService.js   <- plug your ML model in here
│   ├── disposalService.js    QR token + nearest hub
│   ├── ledgerService.js      EcoPoints summary + leaderboard
│   └── mockData.js           placeholder data (delete when backend is live)
├── hooks/
│   ├── useCamera.js          WebRTC getUserMedia lifecycle
│   ├── useDetection.js       frame -> model loop (no overlapping requests)
│   ├── useMeasuredFps.js     real FPS from the video element
│   ├── useAsyncData.js       loading/error/data for any service call
│   └── useDisposalToken.js
├── components/
│   ├── ui/                   Card, Badge, ActionButton, StatTile, AsyncView
│   ├── layout/Header.jsx
│   ├── scanner/              LiveStream, BoundingBox, TelemetryBar, CameraPlaceholder,
│   │                         ClassificationPanel, ContaminationMeter, PrepChecklist,
│   │                         TokenModal, QrGlyph
│   ├── map/                  DropoffFinder, MapCanvas
│   ├── ledger/               EcoLedger, WeeklyActivityChart
│   └── leaderboard/          Leaderboard
├── pages/                    ScannerPage (wires everything), MapPage, AnalyticsPage, LeaderboardPage
└── utils/                    frame.js (video -> Blob), audio.js
```

## Connecting your model and backend
Set `VITE_USE_MOCK=false` in `.env`, then implement the endpoints below.
Each service has an adapter that maps your response to the UI shape, so only
that one function changes if your format differs.

| Purpose | Endpoint | Service |
|---|---|---|
| Classify a frame | `POST /api/v1/detect` (multipart `frame` JPEG) | `detectionService.detect` |
| Issue QR token | `POST /api/v1/disposal-tokens` | `disposalService.createDisposalToken` |
| Nearest hub | `GET /api/v1/hubs/nearest` | `disposalService.getNearestHub` |
| EcoPoints summary | `GET /api/v1/ledger/summary` | `ledgerService.getLedgerSummary` |
| Leaderboard | `GET /api/v1/leaderboard` | `ledgerService.getLeaderboard` |

`/detect` response (return `null` / empty when nothing is found). `bbox` is
normalised 0..1 with a top-left origin, and is measured on the un-mirrored frame:
```json
{
  "label": "PET Plastic Bottle", "category": "Dry / Recyclable",
  "confidence": 0.964, "weight_g": 28.5, "material_grade": "PET-01",
  "contamination": { "level": "Low", "label": "Clean", "score": 0.14 },
  "steps": ["Unscrew cap & separate collar.", "..."],
  "bbox": { "x": 0.34, "y": 0.22, "w": 0.26, "h": 0.56 }
}
```

**In-browser inference instead of HTTP:** in `detectionService.detect`, pass the
`video` element straight to ONNX Runtime Web / TensorFlow.js and map the output
through `toDetection`. Nothing else changes.

**Tuning:** `DETECTION_INTERVAL_MS` in `config/constants.js` sets how often frames are sent.

## Placeholders to replace
- `QrGlyph` is a visual stand-in. Use a real QR encoder (e.g. `qrcode.react`).
- `MapCanvas` is a static mock. Swap for Leaflet/Mapbox with `hub.lat` / `hub.lng`.
- The "HEVC" label is display-only; browsers don't expose the stream codec.
- Auth, geolocation and saving captures to the backend aren't wired yet.
