import io
import json
import logging
import math
import os
import re
import threading
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool
from ultralytics import YOLO

from waste_rules import BIN_MAPPING, CLASS_NAMES, SMALL_ITEM_CLASSES, display_name, get_bin_rule

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ecoscan")

BASE_DIR = Path(__file__).resolve().parent


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        logger.warning("Invalid %s, falling back to %s", name, default)
        return default


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        logger.warning("Invalid %s, falling back to %s", name, default)
        return default


# Inference tunables. Tuned for cluttered multi-item frames: a higher imgsz
# catches small items (caps, batteries, scrap paper), a lower conf keeps more
# than just the single most obvious item, and iou=0.45 stops adjacent items
# of different classes from suppressing each other in NMS.
CONF_THRESHOLD = _env_float("ECOSCAN_CONF", 0.25)
IOU_THRESHOLD = _env_float("ECOSCAN_IOU", 0.45)
IMG_SIZE = _env_int("ECOSCAN_IMGSZ", 960)
MAX_DET = _env_int("ECOSCAN_MAX_DET", 40)
MAX_UPLOAD_BYTES = _env_int("ECOSCAN_MAX_UPLOAD_BYTES", 8 * 1024 * 1024)
# Two boxes of different classes overlapping this much are the same physical object.
CROSS_CLASS_IOU = _env_float("ECOSCAN_CROSS_CLASS_IOU", 0.80)
# A "small item" class (cap, lid, battery, bulb, straw - see waste_rules.py)
# covering more of the frame than this is a plausibility failure, not a huge
# bottle cap: the classification head is very likely wrong about a box this
# size, so the detection is dropped rather than shown as if it were reliable.
# Generous on purpose - held close to a webcam a small item legitimately fills
# a good chunk of frame.
SMALL_ITEM_MAX_AREA = _env_float("ECOSCAN_SMALL_ITEM_MAX_AREA", 0.15)
DEVICE = os.getenv("ECOSCAN_DEVICE") or None

# The fine-tuned 22-class YOLOv8 checkpoint (see backend/bin_mapping.json for
# the bin-routing rules). taco_best.pt is kept on disk but no longer loaded.
MODEL_CANDIDATES = [
    BASE_DIR / "models" / "best.pt",
    Path("backend/models/best.pt"),
]

# Ultralytics predict() mutates per-model state, so it is not safe to run the
# same model object from several threadpool workers at once.
_INFER_LOCK = threading.Lock()


def resolve_model_path() -> Path:
    override = os.getenv("ECOSCAN_MODEL_PATH")
    candidates = [Path(override)] if override else MODEL_CANDIDATES
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        f"Could not find model file in candidate locations: {[str(p) for p in candidates]}"
    )


def _run_inference(image: Image.Image, augment: bool = False):
    """
    `augment` runs Ultralytics' test-time augmentation (flipped/scaled passes,
    merged) - measurably raises confidence on real detections (verified on a
    reflective poly-bag photo: 0.37 -> 0.77 on the same box) but roughly
    doubles latency. Never used for the live camera loop, where that latency
    would stack on every 150ms tick; only the one-shot image-upload path opts
    in (see detect_waste's `augment` form field).
    """
    with _INFER_LOCK:
        return app.state.model.predict(
            source=image,
            conf=CONF_THRESHOLD,
            iou=IOU_THRESHOLD,
            max_det=MAX_DET,
            imgsz=IMG_SIZE,
            device=DEVICE,
            augment=augment,
            verbose=False,
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    model_path = resolve_model_path()
    logger.info("Loading EcoScan YOLOv8 model from: %s", model_path)
    app.state.model = YOLO(str(model_path))
    app.state.classes = app.state.model.names
    app.state.model_path = str(model_path)
    logger.info("Model loaded with %d classes: %s", len(app.state.classes), app.state.classes)

    loaded_names = set(app.state.classes.values()) if isinstance(app.state.classes, dict) else set(app.state.classes)
    missing = [c for c in CLASS_NAMES if c not in loaded_names]
    if missing:
        logger.warning(
            "Checkpoint is missing %d expected class(es) vs. the documented taxonomy: %s",
            len(missing), missing,
        )
    unmapped = [c for c in loaded_names if c not in BIN_MAPPING]
    if unmapped:
        logger.warning(
            "%d checkpoint class(es) have no bin_mapping.json entry (will use the default rule): %s",
            len(unmapped), sorted(unmapped),
        )

    # The first predict() call builds lazy state and takes seconds; do it now so
    # the first real camera frame is fast instead of stalling the live scanner.
    try:
        await run_in_threadpool(_run_inference, Image.new("RGB", (IMG_SIZE, IMG_SIZE), (0, 0, 0)))
        logger.info("Model warmup complete (imgsz=%d, conf=%.2f)", IMG_SIZE, CONF_THRESHOLD)
    except Exception:
        logger.exception("Model warmup failed; first request may be slow")

    yield
    logger.info("Shutting down; releasing model")
    app.state.model = None


app = FastAPI(
    title="EcoScan AI Backend",
    version="2.0.0",
    description="Waste classification backend powered by a fine-tuned Ultralytics YOLOv8 model (22-class taxonomy)",
    lifespan=lifespan,
)

# Allow the Vite dev server (any port) and LAN testing from a phone. Set
# ECOSCAN_CORS_ORIGINS (comma-separated) to lock this down in production.
_configured_origins = os.getenv("ECOSCAN_CORS_ORIGINS", "").strip()
if _configured_origins:
    _origin_kwargs: Dict[str, Any] = {
        "allow_origins": [o.strip() for o in _configured_origins.split(",") if o.strip()]
    }
else:
    _origin_kwargs = {
        "allow_origins": [],
        "allow_origin_regex": (
            r"https?://(localhost|127\.0\.0\.1|\[::1\]"
            r"|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?"
        ),
    }

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    **_origin_kwargs,
)


def _health_payload() -> Dict[str, Any]:
    is_loaded = getattr(app.state, "model", None) is not None
    return {
        "status": "ok" if is_loaded else "degraded",
        "model_loaded": is_loaded,
        "model_path": getattr(app.state, "model_path", None),
        "classes": getattr(app.state, "classes", {}),
        "conf_threshold": CONF_THRESHOLD,
        "iou_threshold": IOU_THRESHOLD,
        "imgsz": IMG_SIZE,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint to verify backend and model status."""
    return _health_payload()


@app.get("/api/v1/health")
async def health_check_api():
    """Same as /health, under /api so the Vite dev proxy can reach it."""
    return _health_payload()


def _iou(a: Dict[str, float], b: Dict[str, float]) -> float:
    ax2, ay2 = a["x"] + a["w"], a["y"] + a["h"]
    bx2, by2 = b["x"] + b["w"], b["y"] + b["h"]
    inter_w = max(0.0, min(ax2, bx2) - max(a["x"], b["x"]))
    inter_h = max(0.0, min(ay2, by2) - max(a["y"], b["y"]))
    inter = inter_w * inter_h
    union = a["w"] * a["h"] + b["w"] * b["h"] - inter
    return inter / union if union > 0 else 0.0


def _containment(a: Dict[str, float], b: Dict[str, float]) -> float:
    """How much of the SMALLER box sits inside the other, 0..1.

    Plain IoU is a poor duplicate test when one box is mostly inside a much
    bigger one (a small tile fragment of a large object, say): the union is
    dominated by the big box, so IoU stays low even though the small box is
    obviously part of it. This looks at overlap relative to the smaller
    box's own area instead, which is what "is this just a piece of that?"
    actually asks. Only used for _tiled_inference's fragment suppression -
    the live/single-pass path is untouched by it.
    """
    ax2, ay2 = a["x"] + a["w"], a["y"] + a["h"]
    bx2, by2 = b["x"] + b["w"], b["y"] + b["h"]
    inter_w = max(0.0, min(ax2, bx2) - max(a["x"], b["x"]))
    inter_h = max(0.0, min(ay2, by2) - max(a["y"], b["y"]))
    inter = inter_w * inter_h
    smaller = min(a["w"] * a["h"], b["w"] * b["h"])
    return inter / smaller if smaller > 0 else 0.0


def _prominence(confidence: float, box: Dict[str, float]) -> float:
    """Rank detections the way a user aims a scanner.

    Confidence stays dominant, but a large, centred object beats a marginally
    more confident speck in the corner — that is the item being held up.
    """
    area = max(0.0, box["w"]) * max(0.0, box["h"])
    size = math.sqrt(min(1.0, area))
    cx = box["x"] + box["w"] / 2
    cy = box["y"] + box["h"] / 2
    offset = math.hypot(cx - 0.5, cy - 0.5) / math.sqrt(0.5)
    centrality = 1.0 - min(1.0, offset)
    return confidence * (0.55 + 0.45 * size) * (0.78 + 0.22 * centrality)


def _boxes_to_candidates(boxes, tile_box: tuple, frame_w: int, frame_h: int) -> List[Dict[str, Any]]:
    """Convert one Ultralytics Boxes object into candidates in FULL-FRAME pixels.

    `tile_box` = (offset_x, offset_y, tile_w, tile_h), the tile's own position
    within the full frame. For a plain (non-tiled) call the tile IS the frame,
    so offset is (0, 0) and tile size equals frame size.
    """
    if boxes is None or len(boxes) == 0:
        return []
    ox, oy, tw, th = tile_box
    xyxyn = boxes.xyxyn.cpu().numpy()
    confs = boxes.conf.cpu().numpy()
    class_ids = boxes.cls.cpu().numpy().astype(int)

    candidates = []
    for (x1, y1, x2, y2), conf, cls_id in zip(xyxyn, confs, class_ids):
        # Explicit float() on each: unpacking a numpy row hands back
        # numpy.float32 scalars, which arithmetic below would otherwise
        # silently promote to numpy.float64 - neither is JSON-serializable
        # by FastAPI's default encoder, so this must happen before use.
        x1, y1, x2, y2 = float(x1), float(y1), float(x2), float(y2)
        candidates.append(
            {
                "cls_id": int(cls_id),
                "conf": float(conf),
                "x1": max(0.0, min(float(frame_w), ox + x1 * tw)),
                "y1": max(0.0, min(float(frame_h), oy + y1 * th)),
                "x2": max(0.0, min(float(frame_w), ox + x2 * tw)),
                "y2": max(0.0, min(float(frame_h), oy + y2 * th)),
            }
        )
    return candidates


def _finalize_detections(
    candidates: List[Dict[str, Any]], names, frame_w: int, frame_h: int, dedup_iou: float = None
) -> List[Dict[str, Any]]:
    """Shared pipeline from raw candidates (one pass or merged across tiles) to
    the standardized detection payload: class resolution, the small-item
    plausibility guard, rule lookup, prominence scoring, and cross-class NMS.

    `dedup_iou` overrides CROSS_CLASS_IOU for the final merge. The default
    (0.80) suits one pass over one frame, where two boxes only collide this
    much if they're genuinely the same object. Merging several tiles' partial
    views of something needs a much lower bar (see _tiled_inference): two
    tiles can each see a different slice of the same object with surprisingly
    little mutual overlap while still obviously being it.
    """
    detections: List[Dict[str, Any]] = []
    for c in candidates:
        w = c["x2"] - c["x1"]
        h = c["y2"] - c["y1"]
        if w <= 0 or h <= 0:
            continue
        norm_box = {
            "x": round(c["x1"] / frame_w, 4),
            "y": round(c["y1"] / frame_h, 4),
            "w": round(w / frame_w, 4),
            "h": round(h / frame_h, 4),
        }

        cls_id = c["cls_id"]
        if isinstance(names, dict):
            class_name = names.get(cls_id, f"class_{cls_id}")
        else:
            class_name = names[cls_id] if 0 <= cls_id < len(names) else f"class_{cls_id}"

        # A cap/lid/battery/bulb/straw box covering a large share of the frame
        # is a classification error, not an oversized cap - drop it rather
        # than show a confident-looking label on the wrong object.
        area = norm_box["w"] * norm_box["h"]
        if class_name in SMALL_ITEM_CLASSES and area > SMALL_ITEM_MAX_AREA:
            logger.debug(
                "Dropping implausible %s: box covers %.0f%% of frame (max %.0f%%)",
                class_name, area * 100, SMALL_ITEM_MAX_AREA * 100,
            )
            continue

        confidence = round(c["conf"], 3)
        rule = get_bin_rule(class_name)
        pixel_bbox = [round(c["x1"], 1), round(c["y1"], 1), round(c["x2"], 1), round(c["y2"], 1)]
        detections.append(
            {
                "label": class_name,
                "display_name": display_name(class_name),
                "confidence": confidence,
                "bbox": pixel_bbox,
                "bin": rule["bin"],
                "color": rule["color"],
                "tip": rule["tip"],
                "is_hazardous": bool(rule["is_hazardous"]),
                # Kept for internal ranking/de-dup only; stripped before the
                # response is sent (see detect_waste below).
                "_norm_box": norm_box,
                "_score": round(_prominence(confidence, norm_box), 4),
            }
        )

    detections.sort(key=lambda d: d["_score"], reverse=True)

    tiled_mode = dedup_iou is not None
    threshold = CROSS_CLASS_IOU if dedup_iou is None else dedup_iou
    # NMS runs per class (and per tile, when tiled), so one physical item can
    # come back as two classes, or the same class from two overlapping tiles.
    # Keep the stronger reading regardless of which pass or class produced it.
    # Containment only applies in tiled mode: on a single full-frame pass two
    # boxes rarely nest like that without genuinely being the same object, so
    # the extra check isn't needed there and isn't run.
    kept: List[Dict[str, Any]] = []
    for det in detections:
        is_dup = any(_iou(det["_norm_box"], k["_norm_box"]) >= threshold for k in kept)
        if not is_dup and tiled_mode:
            is_dup = any(_containment(det["_norm_box"], k["_norm_box"]) >= TILE_CONTAINMENT for k in kept)
        if is_dup:
            continue
        kept.append(det)
    return kept


def _extract_detections(result, names, frame_w: int, frame_h: int) -> List[Dict[str, Any]]:
    """Parse one Ultralytics result (a single full-frame pass) into the
    standardized detection payload. `bbox` is pixel-space [x1, y1, x2, y2]
    against the frame's own width/height, matching what the bounding box
    overlay expects.
    """
    candidates = _boxes_to_candidates(result.boxes, (0, 0, frame_w, frame_h), frame_w, frame_h)
    return _finalize_detections(candidates, names, frame_w, frame_h)


# Each quadrant tile covers this fraction of the frame's width/height, so
# adjacent tiles overlap by (1 - TILE_FRACTION) * 2 and nothing sits exactly
# on a tile boundary the way it would with an even, non-overlapping split.
TILE_FRACTION = 0.65
# Below this, tiling just re-detects the same content at lower resolution
# per tile than the full frame already had - skip it.
TILE_MIN_SIDE = 400
# See _tiled_inference: below this IoU with a full-frame detection, a tile's
# candidate is a fragment of something already found, not a new item.
TILE_FRAGMENT_IOU = 0.30
# See _containment: 70%+ of a candidate's own area sitting inside another
# box marks it a fragment of that box too, independent of plain IoU.
TILE_CONTAINMENT = 0.70


def _tile_boxes(frame_w: int, frame_h: int) -> List[tuple]:
    """(offset_x, offset_y, tile_w, tile_h) for each overlapping quadrant."""
    if frame_w < TILE_MIN_SIDE or frame_h < TILE_MIN_SIDE:
        return []
    tw, th = int(frame_w * TILE_FRACTION), int(frame_h * TILE_FRACTION)
    xs = sorted({0, frame_w - tw})
    ys = sorted({0, frame_h - th})
    return [(x, y, tw, th) for x in xs for y in ys]


def _tiled_inference(image: Image.Image, names, augment: bool) -> List[Dict[str, Any]]:
    """
    Runs the full frame plus overlapping quadrant tiles and merges every
    candidate through the same finalization pipeline as a single pass.

    A large photo gets crushed down to imgsz for one pass - that's exactly
    what erases a small or partly-hidden item's signal, since it ends up only
    a handful of pixels across once downscaled. Each tile is inferred at the
    same imgsz, so an item that was lost in the full-frame pass gets roughly
    2x the relative resolution. Verified on a real cluttered poly-bag photo:
    the full-frame pass produced zero candidate boxes at ANY confidence for
    a region a tile then found at 48%.

    This does not fix the model calling something the wrong class - a region
    that was invisible in the full-frame pass can still come back mislabeled
    once a tile surfaces it. It only stops a real object from being silently
    dropped because it lost too much resolution to register at all.

    A naive merge breaks badly on anything bigger than one tile: each tile
    only sees part of it, and those partial views don't overlap each other
    enough to be caught as duplicates by CROSS_CLASS_IOU, so the same object
    comes back reported 5-6 times as separate items. Fixed by resolving the
    full frame's own detections first, then dropping any tile candidate that
    overlaps one of those beyond TILE_FRAGMENT_IOU - a much lower bar than
    CROSS_CLASS_IOU, since a partial view of a large box can have surprisingly
    modest overlap with the whole box while still obviously being it. Only
    candidates novel to a tile (something the full frame missed entirely)
    survive to the final merge.

    Only used for the one-shot image-upload path (up to ~5x the latency of a
    single pass) - never the live 150ms loop.
    """
    frame_w, frame_h = image.size

    full_result = _run_inference(image, augment)
    full_candidates = (
        _boxes_to_candidates(full_result[0].boxes, (0, 0, frame_w, frame_h), frame_w, frame_h)
        if full_result
        else []
    )
    # What the full frame alone would report - a tile candidate that's just a
    # partial view of one of these gets dropped, not merged in as "new".
    base_boxes = [d["_norm_box"] for d in _finalize_detections(full_candidates, names, frame_w, frame_h)]

    all_candidates = list(full_candidates)
    for tile_box in _tile_boxes(frame_w, frame_h):
        ox, oy, tw, th = tile_box
        tile_result = _run_inference(image.crop((ox, oy, ox + tw, oy + th)), augment)
        if not tile_result:
            continue
        for cand in _boxes_to_candidates(tile_result[0].boxes, tile_box, frame_w, frame_h):
            w, h = cand["x2"] - cand["x1"], cand["y2"] - cand["y1"]
            if w <= 0 or h <= 0:
                continue
            cand_box = {"x": cand["x1"] / frame_w, "y": cand["y1"] / frame_h, "w": w / frame_w, "h": h / frame_h}
            if any(_iou(cand_box, b) >= TILE_FRAGMENT_IOU for b in base_boxes):
                continue
            if any(_containment(cand_box, b) >= TILE_CONTAINMENT for b in base_boxes):
                continue
            all_candidates.append(cand)

    return _finalize_detections(all_candidates, names, frame_w, frame_h, dedup_iou=TILE_FRAGMENT_IOU)


def _decode_upload(image_bytes: bytes) -> Image.Image:
    """Decode + normalize one uploaded image. Raises ValueError with a
    human-readable message on anything invalid; callers turn that into the
    HTTPException that fits their endpoint's response shape.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Force decoding here so truncated/corrupt uploads fail before inference.
        image.load()
        # Honour EXIF rotation so boxes line up with what the client displays.
        return ImageOps.exif_transpose(image).convert("RGB")
    except Exception as e:
        raise ValueError(f"Invalid image file: {str(e)}") from e


async def _detect_on_image(image: Image.Image, augment: bool) -> List[Dict[str, Any]]:
    """Run inference on one already-decoded image and return the public
    detection shape (label, display_name, confidence, bbox, bin, color, tip,
    is_hazardous), most-prominent-first. Shared by /detect and /detect-multi
    so both endpoints stay on exactly the same pipeline.
    """
    if augment:
        # One-shot path: also run overlapping tiles, not just the full frame
        # - see _tiled_inference for why. Meaningfully slower, which is why
        # this is never used for the live loop.
        detections = await run_in_threadpool(_tiled_inference, image, app.state.model.names, augment)
    else:
        results = await run_in_threadpool(_run_inference, image, augment)
        detections = (
            _extract_detections(results[0], app.state.model.names, image.width, image.height)
            if results
            else []
        )
    return [
        {k: d[k] for k in ("label", "display_name", "confidence", "bbox", "bin", "color", "tip", "is_hazardous")}
        for d in detections
    ]


@app.post("/api/v1/detect")
async def detect_waste(frame: UploadFile = File(...), augment: bool = Form(False)):
    """
    Accepts multipart image field 'frame'. Optional form field `augment`
    (sent by the one-shot image-upload path, never the live loop) trades
    latency for higher confidence via test-time augmentation and tiled
    inference - see _run_inference and _tiled_inference.

    Runs YOLO inference and returns every detected item as a standardized
    detection so the frontend can render all of them at once:

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
        }
      ],
      "frame": { "w": 960, "h": 720 }
    }

    Detections are ordered most-prominent-first (confidence + size + framing).
    See /api/v1/detect-multi for scanning several photos of the same bag at
    once (front/side/back) rather than one.
    """
    if getattr(app.state, "model", None) is None:
        raise HTTPException(status_code=503, detail="YOLO model is not initialized")

    if frame.content_type and not frame.content_type.startswith("image/"):
        raise HTTPException(
            status_code=415, detail=f"Expected an image upload, got {frame.content_type}"
        )

    image_bytes = await frame.read()
    if not image_bytes:
        return {"total_items": 0, "detections": [], "frame": None}
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413, detail=f"Frame exceeds {MAX_UPLOAD_BYTES} byte limit"
        )

    try:
        image = _decode_upload(image_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    frame_info = {"w": image.width, "h": image.height}
    try:
        public_detections = await _detect_on_image(image, augment)
    except Exception:
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail="Inference failed")

    if public_detections:
        logger.debug(
            "Detected %d item(s): %s",
            len(public_detections),
            ", ".join(f"{d['label']} ({d['confidence']:.2f})" for d in public_detections),
        )

    return {"total_items": len(public_detections), "detections": public_detections, "frame": frame_info}


# A bag scan is realistically 2-4 angles; this is a generous ceiling against
# someone scripting an oversized multipart request, not a expected usage cap.
MAX_ANGLE_IMAGES = 6


@app.post("/api/v1/detect-multi")
async def detect_waste_multi(frames: List[UploadFile] = File(...), augment: bool = Form(True)):
    """
    Multi-angle bag scan: several photos of the SAME contents from different
    angles (front/side/back), sent as repeated 'frames' fields in one
    multipart request. A transparent bag's glare and self-occlusion often
    hide an item from one angle that a different angle simply doesn't have
    that problem with - see hooks/useImageDetection.js and _tiled_inference
    for the single-photo mitigations; this is the complementary technique of
    changing the photo itself rather than reprocessing one image harder.

    `augment` defaults to True here (unlike /detect) since, like the
    single-image upload, this is a deliberate one-shot scan, not the live
    150ms loop.

    Boxes from different photos are NOT in the same coordinate space and are
    never merged onto one canvas. Each photo's own detections - with boxes
    valid against that photo's own `frame` - come back under `angles`, in
    upload order, for a UI to draw per-photo boxes correctly. `detections` is
    the deduplicated inventory: one entry per class actually seen anywhere,
    keeping its highest-confidence sighting's bbox (`source_frame_index`
    says which photo that bbox belongs to), plus `seen_in_frames` - how many
    of the uploaded photos showed that class at all, a reliability signal a
    single photo can't give you.

    {
      "total_photos": 3,
      "total_items": 2,
      "detections": [
        {
          "label": "plastic_bottle", "display_name": "Plastic Bottle",
          "confidence": 0.81, "bbox": [...], "bin": "Dry / Recyclable",
          "color": "#3B82F6", "tip": "...", "is_hazardous": false,
          "seen_in_frames": 2, "source_frame_index": 0
        }
      ],
      "angles": [
        { "frame_index": 0, "frame": { "w": 960, "h": 720 }, "detections": [...] }
      ]
    }
    """
    if getattr(app.state, "model", None) is None:
        raise HTTPException(status_code=503, detail="YOLO model is not initialized")
    if not frames:
        raise HTTPException(status_code=400, detail="No images provided")
    if len(frames) > MAX_ANGLE_IMAGES:
        raise HTTPException(status_code=400, detail=f"Send at most {MAX_ANGLE_IMAGES} photos per scan")

    angles: List[Dict[str, Any]] = []
    for idx, upload in enumerate(frames):
        if upload.content_type and not upload.content_type.startswith("image/"):
            raise HTTPException(
                status_code=415,
                detail=f"Photo {idx + 1}: expected an image upload, got {upload.content_type}",
            )
        image_bytes = await upload.read()
        if not image_bytes:
            continue  # an empty slot contributes nothing - not an error
        if len(image_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413, detail=f"Photo {idx + 1} exceeds {MAX_UPLOAD_BYTES} byte limit"
            )
        try:
            image = _decode_upload(image_bytes)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Photo {idx + 1}: {str(e)}")

        try:
            photo_detections = await _detect_on_image(image, augment)
        except Exception:
            logger.exception("Inference failed on photo %d", idx + 1)
            raise HTTPException(status_code=500, detail=f"Inference failed on photo {idx + 1}")

        angles.append(
            {"frame_index": idx, "frame": {"w": image.width, "h": image.height}, "detections": photo_detections}
        )

    # Merge: the highest-confidence sighting of a class wins the bbox/frame
    # reference returned for it. seen_in_frames counts every distinct photo
    # that class appeared in at all, independent of which one had the best shot.
    best_by_class: Dict[str, Dict[str, Any]] = {}
    seen_counts: Dict[str, int] = {}
    for angle in angles:
        classes_this_photo = set()
        for det in angle["detections"]:
            label = det["label"]
            classes_this_photo.add(label)
            current_best = best_by_class.get(label)
            if current_best is None or det["confidence"] > current_best["confidence"]:
                best_by_class[label] = {**det, "source_frame_index": angle["frame_index"]}
        for label in classes_this_photo:
            seen_counts[label] = seen_counts.get(label, 0) + 1

    merged = [{**det, "seen_in_frames": seen_counts[label]} for label, det in best_by_class.items()]
    # Seen in more angles first (the reliability signal this endpoint exists
    # for), confidence breaking ties.
    merged.sort(key=lambda d: (d["seen_in_frames"], d["confidence"]), reverse=True)

    return {
        "total_photos": len(angles),
        "total_items": len(merged),
        "detections": merged,
        "angles": angles,
    }


# =========================================================================
# Auxiliary endpoints to ensure full frontend functionality with real API
# =========================================================================

@app.get("/api/v1/waste-rules")
async def get_waste_rules():
    """
    The configured disposal rules, keyed by model class name.

    Lets the Waste Guide render the rules that are actually in force instead of
    keeping a second copy in the frontend that can drift out of step.
    """
    classes = getattr(app.state, "classes", {}) or {}
    known = list(classes.values()) if isinstance(classes, dict) else list(classes)
    names = known or list(BIN_MAPPING.keys())
    return {
        "classes": names,
        "rules": {
            name: {"display_name": display_name(name), **get_bin_rule(name)}
            for name in names
        },
    }


class DisposalTokenRequest(BaseModel):
    class_name: Optional[str] = None
    bin: Optional[str] = None
    # Older clients sent a material grade; still accepted as a code source.
    grade: Optional[str] = None


@app.post("/api/v1/disposal-tokens")
async def create_disposal_token(req: DisposalTokenRequest):
    """Generate QR disposal token for detected waste item.

    The new taxonomy has no material grade, so the class name is the code of
    choice; `grade` is still accepted for older clients.
    """
    source = req.class_name or req.grade or "GEN"
    code = re.sub(r"[^A-Z0-9]+", "-", str(source).upper()).strip("-") or "GEN"
    rand_code = uuid.uuid4().hex[:6].upper()
    return {"token": f"ECO-{code}-{rand_code}"}


# =========================================================================
# Waste pickup scheduling
#
# A collection request the user raises from the Facilities page when going to
# a drop-off point themselves isn't practical. Stored as JSON on disk rather
# than in memory so a scheduled pickup survives a backend restart - it is a
# commitment the user made, not a cache.
#
# NOTE: this records and tracks the request. It does NOT dispatch to a real
# courier or waste-collection service - there's no such integration in this
# project - and the UI says so rather than implying a van is on its way.
# =========================================================================

PICKUPS_PATH = Path(os.getenv("ECOSCAN_PICKUPS_PATH", str(BASE_DIR / "data" / "pickups.json")))
_PICKUPS_LOCK = threading.Lock()


def _load_pickups() -> List[Dict[str, Any]]:
    try:
        with open(PICKUPS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except FileNotFoundError:
        return []
    except (ValueError, json.JSONDecodeError):
        logger.exception("pickups.json is unreadable; starting from an empty list")
        return []


def _save_pickups(pickups: List[Dict[str, Any]]) -> None:
    PICKUPS_PATH.parent.mkdir(parents=True, exist_ok=True)
    # Write via a temp file so an interrupted write can't truncate the store.
    tmp = PICKUPS_PATH.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(pickups, f, indent=2)
    tmp.replace(PICKUPS_PATH)


class PickupRequest(BaseModel):
    name: str
    phone: str
    address: str
    preferred_date: str
    time_window: str
    waste_types: List[str] = []
    notes: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    # Where the collected waste is headed, when the user picked a facility
    # from the nearby list rather than leaving it to the operator.
    facility_name: Optional[str] = None


@app.get("/api/v1/pickups")
async def list_pickups():
    """Every pickup this install has scheduled, newest first."""
    with _PICKUPS_LOCK:
        pickups = _load_pickups()
    return {"pickups": sorted(pickups, key=lambda p: p.get("created_at", ""), reverse=True)}


@app.post("/api/v1/pickups", status_code=201)
async def create_pickup(req: PickupRequest):
    """Schedule a waste collection from the user's address."""
    required = {"name": req.name, "phone": req.phone, "address": req.address,
                "preferred_date": req.preferred_date, "time_window": req.time_window}
    missing = [field for field, value in required.items() if not str(value or "").strip()]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required field(s): {', '.join(missing)}")

    pickup = {
        "id": f"PU-{uuid.uuid4().hex[:8].upper()}",
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "name": req.name.strip(),
        "phone": req.phone.strip(),
        "address": req.address.strip(),
        "preferred_date": req.preferred_date,
        "time_window": req.time_window,
        "waste_types": [w for w in req.waste_types if str(w).strip()],
        "notes": (req.notes or "").strip() or None,
        "lat": req.lat,
        "lon": req.lon,
        "facility_name": req.facility_name,
    }

    with _PICKUPS_LOCK:
        pickups = _load_pickups()
        pickups.append(pickup)
        _save_pickups(pickups)

    logger.info("Pickup %s scheduled for %s (%s)", pickup["id"], pickup["preferred_date"], pickup["time_window"])
    return pickup


@app.post("/api/v1/pickups/{pickup_id}/cancel")
async def cancel_pickup(pickup_id: str):
    """Cancel a scheduled pickup. Kept in the list as cancelled, not deleted,
    so the user can still see it happened."""
    with _PICKUPS_LOCK:
        pickups = _load_pickups()
        target = next((p for p in pickups if p.get("id") == pickup_id), None)
        if target is None:
            raise HTTPException(status_code=404, detail=f"No pickup with id {pickup_id}")
        target["status"] = "cancelled"
        target["cancelled_at"] = datetime.now(timezone.utc).isoformat()
        _save_pickups(pickups)
    return target


@app.get("/api/v1/ledger/summary")
async def get_ledger_summary():
    """Return scanning statistics and weekly impact summary."""
    return {
        "points": 340,
        "streak_days": 5,
        "items_scanned": 28,
        "accuracy_pct": 98.2,
        "co2_offset_kg": 4.2,
        "weekly": [
            {"day": "Mon", "items": 3},
            {"day": "Tue", "items": 5},
            {"day": "Wed", "items": 2},
            {"day": "Thu", "items": 6},
            {"day": "Fri", "items": 4},
            {"day": "Sat", "items": 7},
            {"day": "Sun", "items": 1},
        ],
    }


@app.get("/api/v1/leaderboard")
async def get_leaderboard():
    """Return community leaderboard."""
    return [
        {"id": "1", "name": "Aarav M.", "points": 1280, "streak_days": 21},
        {"id": "2", "name": "Ishita R.", "points": 1104, "streak_days": 14},
        {"id": "3", "name": "You", "points": 340, "streak_days": 5, "is_you": True},
        {"id": "4", "name": "Kabir S.", "points": 322, "streak_days": 3},
        {"id": "5", "name": "Meera T.", "points": 298, "streak_days": 6},
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
