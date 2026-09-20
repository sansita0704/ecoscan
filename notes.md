## What this is

EcoScan is a browser-based waste-sorting assistant. Users scan waste through a webcam or upload a photo; a fine-tuned YOLOv8 model identifies supported waste objects, deterministic rules map them to disposal bins, and optional Groq-based language-model advice explains what to do. The app also provides waste guidance, drop-off facilities, QR disposal tokens, local scan history, impact statistics, and a sample leaderboard.

### Stack

- **Language(s):** JavaScript/JSX frontend, Python ML backend
- **Framework / runtime:** React 18 + Vite 5, Tailwind CSS, FastAPI, Ultralytics YOLOv8
- **Notable libraries:**
    - `react`, `react-dom`
    - `lucide-react` for icons
    - `ai` and `@ai-sdk/groq` for structured disposal advice
    - `zod` for validating AI responses
    - `ultralytics` and `Pillow` for image detection
    - WebRTC `getUserMedia` for camera access
    - OpenStreetMap Overpass API for facilities

## How it's organized

```text
api/
  ai/advice.js              Vercel serverless entry point for AI advice

backend/
  main.py                   FastAPI application and YOLO inference pipeline
  waste_rules.py             Loads and applies disposal rules
  bin_mapping.json           Source-of-truth mapping for 22 waste classes
  models/
    best.pt                 Primary YOLOv8 checkpoint
    taco_best.pt            Retained model, currently not loaded
  requirements.txt           Python dependencies

server/
  devMiddleware.js           Runs the AI route inside the Vite dev server
  lib/
    adviceHandler.js         Validates requests, calls Groq, joins facilities
    adviceSchema.js           Zod schema for structured model output
    buildPrompt.js            Provenance-aware AI prompt construction
    facilities.js              OpenStreetMap/Overpass facility search
    rulesFallback.js           Deterministic advice fallback

src/
  main.jsx                   React bootstrap
  App.jsx                    Global shell and page switching

  pages/
    LandingPage.jsx           Home/marketing view
    ScannerPage.jsx           Main live-camera/upload scanning experience
    WasteGuidePage.jsx        Waste taxonomy and disposal reference
    FacilitiesPage.jsx        Drop-off facility search
    ImpactPage.jsx            Local scan history, points, charts, leaderboard

  components/
    layout/                   Header, sidebar, mobile navigation, page headers
    scanner/                  Camera, upload, detections, advice, QR modal
    guide/                    Waste-category cards
    map/                      Facility finder and map display
    ledger/                   Weekly activity visualization
    leaderboard/              Community leaderboard
    illustrations/            Inline SVG waste illustrations
    landing/                  Hero scanning visual
    ui/                       Reusable buttons, cards, badges, tabs, states

  hooks/
    useCamera.js              WebRTC camera lifecycle
    useDetection.js            Repeated live-frame detection loop
    useImageDetection.js       One-shot uploaded-image detection
    useMultiDisposalAdvice.js Per-item advice state and retries
    useScanLog.js              De-duplicated local scan recording
    useGeolocation.js          Precise location with fallback coordinates
    useDisposalToken.js        QR disposal-token state
    useVideoViewport.js        Camera box geometry
    useImageViewport.js        Uploaded-image box geometry
    useAsyncData.js             Generic async loading/error state

  services/
    detectionService.js        Detection API adapter
    adviceService.js            AI-advice API adapter
    wasteRulesService.js        Waste-rule API adapter
    disposalService.js          Token and hub API adapter
    ledgerService.js            Leaderboard API adapter
    scanHistory.js              localStorage scan ledger
    http.js                     Shared fetch wrapper
    mockData.js                 Mock-mode responses

  config/
    wasteTaxonomy.js            Frontend material and bin presentation rules
    constants.js                Detection and camera tuning
    navigation.js               Navigation definitions
    env.js                      Frontend environment variables

  utils/
    frame.js                    Converts video frames to JPEG blobs
    objectTracker.js             Tracks multiple objects across frames
    classVoter.js                Stabilizes flickering classifications
    boxMapping.js                Maps model boxes onto cropped media
    audio.js                     Scan confirmation sound

  types/
    contracts.js                JSDoc contracts between services and UI
```

### How it fits together

The application is a single React shell rather than a URL-based router. `App.jsx` owns the current view, camera state, local scan history, mute state, and multi-item advice state. It conditionally renders `LandingPage`, `ScannerPage`, `WasteGuidePage`, `FacilitiesPage`, or `ImpactPage`, while the sidebar and mobile navigation update the `view` state.

The central runtime path is:

```text
Camera / uploaded image
        │
        ▼
ScannerPage
        │
        ├── useCamera
        │       └── WebRTC MediaStream
        │
        ├── useDetection
        │       └── detectionService.detect()
        │              └── POST /api/v1/detect
        │                     └── FastAPI + YOLOv8
        │
        └── useImageDetection
                └── detectionService.detectImage()
                       └── POST /api/v1/detect
```

The backend then returns object class, confidence, bounding box, and rule-derived metadata:

```text
YOLO class
  + confidence
  + bounding box
        │
        ▼
backend/waste_rules.py
        │
        ▼
backend/bin_mapping.json
        │
        ▼
bin, color, tip, hazardous flag
```

The frontend adapter in `detectionService.js` converts backend pixel-space bounding boxes into normalized coordinates and creates the UI `Detection` contract. Scanner components can therefore consume either real backend results or mock results without knowing the original response format.

## Main runtime architecture

### 1. React application shell

`src/main.jsx` mounts `<App />` under React Strict Mode.

`App.jsx` owns long-lived application state:

- Current view
- Camera lifecycle through `useCamera`
- Local scan history through `useScanLog`
- Per-item advice through `useMultiDisposalAdvice`
- Mute state for scan sounds

The camera is intentionally owned above `ScannerPage`, so changing views does not automatically destroy the stream. However, the detection loop belongs to `ScannerPage` and stops when the scanner is unmounted.

There is no React Router. Navigation is implemented through:

```text
setView("home" | "scanner" | "guide" | "facilities" | "impact")
```

### 2. Live camera path

`useCamera.js` calls:

```text
navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS)
```

The requested camera settings are approximately:

- User-facing camera
- 1920×1080 ideal resolution
- 60 FPS ideal frame rate
- No audio

It handles:

- Unsupported browsers
- Permission denial
- Camera failures
- Camera unplugging or track termination
- Stopping all tracks during cleanup

`useDetection.js` starts only while `camera.isLive` is true. It schedules a new detection after the previous request completes, so requests do not overlap:

```text
tick()
  → grab current video frame
  → POST image to backend
  → update object tracker
  → schedule next tick after 150 ms
```

The live camera frame is converted to a JPEG by `utils/frame.js`, capped at 960 pixels wide, and sent as multipart form data.

### 3. Multi-object tracking and stabilization

The backend can return multiple objects in a frame. The frontend does not simply display the raw result from the most recent frame.

`objectTracker.js`:

- Matches detections to existing objects using bounding-box IoU
- Creates an independent track for each physical object
- Allows several objects to be confirmed simultaneously
- Smooths bounding-box movement
- Smooths confidence values
- Assigns a `trackId`
- Selects a primary item for the main result panel

Each tracked object has its own `classVoter`.

`classVoter.js` prevents classifications from flickering between similar classes. With the current configuration:

- Six recent detections are considered
- A class needs three votes to be adopted
- The current class can survive with one vote
- Five consecutive empty detections clear the object

This separates two decisions:

```text
Which class is this?  → rolling vote
Is the object still present? → consecutive misses
```

That is important because an occasional empty camera frame should not immediately erase a valid result.

### 4. Bounding-box rendering

The model receives the complete camera frame, but the browser may display it using `object-fit: cover`. That means part of the frame can be cropped.

`boxMapping.js` and `useVideoViewport.js` calculate:

- Displayed media dimensions
- Crop offsets
- Scale
- Correct overlay position

`mapBoxToViewport()` then converts normalized model coordinates to actual CSS pixels. It also compensates for the mirrored user-facing camera preview.

Uploaded images use the same general geometry but with `object-fit: contain`, handled by `useImageViewport.js`.

### 5. Uploaded-image path

`ScannerPage` supports two sources:

```text
Live Camera
Upload Image
```

When the user switches to upload mode:

- The live camera is stopped
- The uploaded image is previewed immediately
- `useImageDetection.js` sends one request
- The request uses `augment=true`
- The backend performs more expensive test-time and tiled inference

The uploaded-image path is deliberately separate from the live loop because it can tolerate much higher latency. It also assigns namespaced IDs such as:

```text
upload-<session>-<index>
```

This prevents advice state from being accidentally reused between different uploaded images.

### 6. Python detection backend

`backend/main.py` creates a FastAPI application and loads the YOLOv8 model during the application lifespan.

Startup behavior:

1. Resolve `backend/models/best.pt`, or use `ECOSCAN_MODEL_PATH`
2. Load the model with Ultralytics
3. Validate the checkpoint’s class names
4. Warn about missing or unmapped classes
5. Run a warm-up inference
6. Expose the API

The backend uses a lock around model inference because Ultralytics model prediction mutates internal model state and is not treated as concurrently safe.

Important tunables include:

```text
ECOSCAN_CONF       Minimum detection confidence
ECOSCAN_IOU        YOLO NMS IoU threshold
ECOSCAN_IMGSZ      Inference resolution
ECOSCAN_MAX_DET    Maximum detections per frame
ECOSCAN_DEVICE     CPU or GPU selection
ECOSCAN_MODEL_PATH Model override
```

### 7. Detection endpoint

The primary endpoint is:

```text
POST /api/v1/detect
```

It accepts a multipart image field named `frame` and optionally an `augment` field.

The response contains:

```json
{
    "total_items": 2,
    "detections": [
        {
            "label": "plastic_bottle",
            "display_name": "Plastic Bottle",
            "confidence": 0.88,
            "bbox": [112.5, 45, 320, 410.5],
            "bin": "Dry / Recyclable",
            "color": "#3B82F6",
            "tip": "Empty liquids and crush before discarding.",
            "is_hazardous": false
        }
    ],
    "frame": {
        "w": 960,
        "h": 720
    }
}
```

The backend’s detection finalization pipeline performs:

1. Convert YOLO boxes to full-frame pixel coordinates
2. Resolve numeric class IDs to class names
3. Drop implausibly large boxes for small-object classes
4. Add bin-routing metadata
5. Calculate prominence using confidence, object size, and centrality
6. Sort detections by prominence
7. Remove duplicate or overlapping detections

For uploaded photos, tiled inference improves detection of small or partially hidden objects. It runs the full image plus overlapping tiles, then removes tile fragments that duplicate full-frame detections.

### 8. Waste taxonomy and routing

The model recognizes 22 classes, including:

- Plastic bottles, bags, cups, lids, boxes, cutlery, straws
- Paper and cardboard
- Cans
- Batteries and bulbs
- Chemical containers
- Paint buckets
- Sticks and organic waste

`backend/bin_mapping.json` is the backend source of truth for:

- Bin destination
- Display color
- Disposal tip
- Hazardous flag

`waste_rules.py` loads this mapping and provides:

- Class-name normalization
- Human-readable display names
- Rule lookup
- Default fallback routing

`src/config/wasteTaxonomy.js` is not model output. It adds frontend presentation concepts:

- Material families: plastic, paper, metal, hazardous, organic
- Bin presentation styles
- Icons
- Confidence bands
- Scoring buckets

This is an important architectural separation:

```text
YOLO model:
  class + confidence + box

Backend rule table:
  bin + color + tip + hazardous flag

Frontend taxonomy:
  material family + UI icon + presentation + scoring category
```

### 9. AI disposal advice

AI advice is intentionally separate from object detection.

The flow is:

```text
Confirmed detection
        │
        ▼
User presses “Get advice”
        │
        ▼
Frontend resolves location
        │
        ▼
POST /api/ai/advice
        │
        ├── Groq language model
        ├── deterministic rules fallback
        └── OpenStreetMap facility lookup
```

The advice endpoint is exposed in two environments:

- Production: `api/ai/advice.js` as a serverless function
- Development: `server/devMiddleware.js` mounted directly into Vite

Both call the same `server/lib/adviceHandler.js`, avoiding separate development and production implementations.

The server validates:

- Detection presence
- Class name
- Confidence range
- Optional location coordinates

If confidence is below `ADVICE_MIN_CONFIDENCE`, the server returns a rescan message without calling the language model.

If Groq is configured, `generateObject()` is used with a Zod schema. The schema requires:

- Summary
- Segregation guidance
- Multiple disposal/reuse actions
- Preparation steps
- Safety warning
- Final recommended action

Facilities are deliberately excluded from the model schema. They are attached afterward from OpenStreetMap data, preventing the model from inventing addresses or opening hours.

If the Groq call is unavailable or fails, `rulesFallback.js` generates advice from the configured disposal rules and marks the response as:

```text
source: "rules"
degraded: true
```

`useMultiDisposalAdvice.js` maintains an independent advice state for every tracked item. Asking for advice about a battery does not replace advice already fetched for a bottle.

### 10. OpenStreetMap facility lookup

`server/lib/facilities.js` queries public Overpass API instances.

It:

- Searches recycling and waste facilities
- Tries 5 km and then 25 km radii
- Filters by material tags
- Requires staffed centers for hazardous items
- Computes distances using the Haversine formula
- Extracts names, addresses, hours, phones, and accepted materials only when present in OSM
- Caches results for approximately 10 minutes
- Limits total lookup time
- Falls back to an empty facility list rather than blocking advice indefinitely

The frontend obtains a precise location lazily through `useGeolocation.js`. Until permission is granted, it uses the configured fallback location:

```text
Jaipur, IN
```

### 11. Disposal tokens

`useDisposalToken.js` calls:

```text
POST /api/v1/disposal-tokens
```

The Python backend generates an identifier such as:

```text
ECO-PLASTIC_BOTTLE-A1B2C3
```

The current `QrGlyph` component is only a visual placeholder; it does not encode a real QR payload yet.

### 12. Local impact ledger

The user’s personal impact data is local to the browser.

`useScanLog.js` records only confirmed live detections and avoids logging the same headline class repeatedly while it remains in view.

`scanHistory.js` stores up to 500 entries in:

```text
localStorage["ecoscan.scans.v1"]
```

It calculates:

- Total scans
- EcoPoints
- Recyclable/landfill/hazardous distribution
- Material-family counts
- Seven-day activity
- Current streak
- Recent scans
- Diversion percentage

The backend’s `/api/v1/ledger/summary` response is currently sample data and is not the source for the user’s own impact figures.

### 13. Facilities, guide, and impact pages

- **Waste Guide:** Calls `/api/v1/waste-rules` so the displayed rules can stay synchronized with the backend mapping.
- **Facilities:** Displays drop-off search UI and hazardous-material guidance.
- **Impact:** Uses local scan history for personal statistics and calls the backend only for the sample community leaderboard.
- **Landing:** Explains the scan/identify/understand/act workflow and displays material-family illustrations.

### 14. Styling and UI system

The UI uses Tailwind CSS with custom design tokens:

- `brand.*` for primary product interactions
- `tech.*` for live detection states
- `success`, `warn`, and `danger` for disposal categories
- `ink.*` for dark camera/map surfaces
- `Inter` as the main font

Reusable UI primitives live under `src/components/ui`, including:

- `Button`
- `Card`
- `Badge`
- `TabBar`
- `AsyncView`
- `EmptyState`
- `ProgressRing`
- `StatTile`

The global stylesheet includes:

- Consistent keyboard focus rings
- Custom scrollbars
- Inter font loading
- Reduced-motion support
- Base background and typography styles

## How to run it

### Frontend only

```bash
npm install
cp .env.example .env
npm run dev
```

Open:

```text
http://localhost:5173
```

Camera access requires `localhost` or HTTPS.

### Python detection backend

```bash
cd backend

python -m venv venv
# Windows
venv/Scripts/activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

The backend runs at:

```text
http://127.0.0.1:8000
```

The Vite development server proxies `/api/v1` to that backend through `VITE_API_PROXY`.

Useful environment variables:

```dotenv
VITE_API_PROXY=http://localhost:8000
VITE_USE_MOCK=false

GROQ_API_KEY=
ADVICE_MODEL=
ADVICE_MIN_CONFIDENCE=0.5

ECOSCAN_CONF=0.25
ECOSCAN_IOU=0.45
ECOSCAN_IMGSZ=960
ECOSCAN_MAX_DET=40
ECOSCAN_DEVICE=
ECOSCAN_MODEL_PATH=
```

For a frontend-only demo:

```dotenv
VITE_USE_MOCK=true
```

Health checks:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/v1/health
```

### Deployment model

The intended deployment is split:

```text
Browser
  ├── Static React/Vite frontend
  ├── /api/v1/* → FastAPI service
  └── /api/ai/advice → Vercel/serverless JavaScript handler
```

The AI server-side secrets are deliberately not prefixed with `VITE_`, preventing them from being bundled into browser JavaScript.

## Notable implementation gaps

- `QrGlyph` is not yet a real QR encoder.
- `MapCanvas` is currently a static/mock map presentation.
- The “HEVC” stream label is display-only; the browser does not expose the actual codec in this implementation.
- Authentication is not implemented.
- Scan captures are not persisted to the backend.
- Geolocation is used for facility lookup but there is no user account or server-side history.
- The backend includes sample ledger and leaderboard data.
- The landing-page copy contains some stale counts: the actual backend taxonomy defines 22 classes, while parts of the landing UI refer to 11 item types.
- The root app uses view state instead of URL routes, so pages are not directly addressable by URL.

## Try asking

- “Trace one live camera detection from `useDetection.js` through `backend/main.py` and into `MultiItemPanel`.”
- “Explain how `objectTracker.js` and `classVoter.js` prevent flickering and duplicate detections.”
- “What would I need to replace to make `MapCanvas` use Leaflet and real OpenStreetMap facility markers?”
