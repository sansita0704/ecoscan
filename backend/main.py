import io
import logging
import math
import os
import threading
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool
from ultralytics import YOLO

from waste_rules import WASTE_RULES, get_waste_rule

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


# Inference tunables. Defaults match how the checkpoint was trained (imgsz=640).
CONF_THRESHOLD = _env_float("ECOSCAN_CONF", 0.35)
IOU_THRESHOLD = _env_float("ECOSCAN_IOU", 0.45)
IMG_SIZE = _env_int("ECOSCAN_IMGSZ", 640)
MAX_DET = _env_int("ECOSCAN_MAX_DET", 20)
MAX_UPLOAD_BYTES = _env_int("ECOSCAN_MAX_UPLOAD_BYTES", 8 * 1024 * 1024)
# Two boxes of different classes overlapping this much are the same physical object.
CROSS_CLASS_IOU = _env_float("ECOSCAN_CROSS_CLASS_IOU", 0.80)
DEVICE = os.getenv("ECOSCAN_DEVICE") or None

MODEL_CANDIDATES = [
    BASE_DIR / "models" / "taco_best.pt",
    BASE_DIR / "models" / "ecoscan_best (1).pt",
    Path("backend/models/taco_best.pt"),
    Path("backend/models/ecoscan_best (1).pt"),
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


def _run_inference(image: Image.Image):
    with _INFER_LOCK:
        return app.state.model.predict(
            source=image,
            conf=CONF_THRESHOLD,
            iou=IOU_THRESHOLD,
            max_det=MAX_DET,
            imgsz=IMG_SIZE,
            device=DEVICE,
            verbose=False,
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    model_path = resolve_model_path()
    logger.info("Loading TACO YOLO model from: %s", model_path)
    app.state.model = YOLO(str(model_path))
    app.state.classes = app.state.model.names
    app.state.model_path = str(model_path)
    logger.info("Model loaded with %d classes: %s", len(app.state.classes), app.state.classes)

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
    version="1.1.0",
    description="Waste classification backend powered by Ultralytics YOLO & TACO dataset",
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


def _extract_detections(result, names) -> List[Dict[str, Any]]:
    boxes = result.boxes
    if boxes is None or len(boxes) == 0:
        return []

    xyxyn = boxes.xyxyn.cpu().numpy()
    confs = boxes.conf.cpu().numpy()
    class_ids = boxes.cls.cpu().numpy().astype(int)

    detections: List[Dict[str, Any]] = []
    for (x1, y1, x2, y2), conf, cls_id in zip(xyxyn, confs, class_ids):
        x1, y1, x2, y2 = (max(0.0, min(1.0, float(v))) for v in (x1, y1, x2, y2))
        box = {
            "x": round(x1, 4),
            "y": round(y1, 4),
            "w": round(max(0.0, x2 - x1), 4),
            "h": round(max(0.0, y2 - y1), 4),
        }
        if box["w"] <= 0 or box["h"] <= 0:
            continue

        cls_id = int(cls_id)
        if isinstance(names, dict):
            class_name = names.get(cls_id, f"class_{cls_id}")
        else:
            class_name = names[cls_id] if 0 <= cls_id < len(names) else f"class_{cls_id}"

        confidence = round(float(conf), 3)
        rule = get_waste_rule(class_name)
        detections.append(
            {
                "class_name": class_name,
                "class_id": cls_id,
                "label": rule["label"],
                "category": rule["category"],
                "confidence": confidence,
                "weight_g": rule["weight_g"],
                "material_grade": rule["material_grade"],
                "contamination": rule["contamination"],
                "steps": rule["steps"],
                "bbox": box,
                "score": round(_prominence(float(conf), box), 4),
            }
        )

    detections.sort(key=lambda d: d["score"], reverse=True)

    # NMS runs per class, so one physical item can come back as two classes
    # (a bottle read as both plastic_bottle and glass_bottle). Keep the stronger.
    kept: List[Dict[str, Any]] = []
    for det in detections:
        if any(_iou(det["bbox"], k["bbox"]) >= CROSS_CLASS_IOU for k in kept):
            continue
        kept.append(det)
    return kept


@app.post("/api/v1/detect")
async def detect_waste(frame: UploadFile = File(...)):
    """
    Accepts multipart image field 'frame'.
    Runs YOLO inference and returns the most prominent detected item at the top
    level (label, category, confidence, bbox, preparation steps) plus every other
    detection in `detections`. `label` is absent when nothing was found.
    """
    if getattr(app.state, "model", None) is None:
        raise HTTPException(status_code=503, detail="YOLO model is not initialized")

    if frame.content_type and not frame.content_type.startswith("image/"):
        raise HTTPException(
            status_code=415, detail=f"Expected an image upload, got {frame.content_type}"
        )

    image_bytes = await frame.read()
    if not image_bytes:
        return {"detections": [], "frame": None}
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413, detail=f"Frame exceeds {MAX_UPLOAD_BYTES} byte limit"
        )

    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Force decoding here so truncated/corrupt uploads fail before inference.
        image.load()
        # Honour EXIF rotation so boxes line up with what the client displays.
        image = ImageOps.exif_transpose(image).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    try:
        results = await run_in_threadpool(_run_inference, image)
    except Exception:
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail="Inference failed")

    frame_info = {"w": image.width, "h": image.height}
    if not results:
        return {"detections": [], "frame": frame_info}

    detections = _extract_detections(results[0], app.state.model.names)
    if not detections:
        return {"detections": [], "frame": frame_info}

    primary = detections[0]
    logger.debug(
        "Detected %s (%.2f) + %d other(s)",
        primary["class_name"],
        primary["confidence"],
        len(detections) - 1,
    )
    # The full rule (steps, contamination, weight) rides on the top level only;
    # `detections` stays lean because it is re-sent several times a second.
    summary = [
        {k: d[k] for k in ("class_name", "label", "category", "confidence", "bbox", "score")}
        for d in detections
    ]
    return {**primary, "detections": summary, "frame": frame_info}


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
    return {
        "classes": known,
        "rules": {name: get_waste_rule(name) for name in (known or WASTE_RULES.keys())},
    }


class DisposalTokenRequest(BaseModel):
    class_name: Optional[str] = None
    grade: Optional[str] = None


@app.post("/api/v1/disposal-tokens")
async def create_disposal_token(req: DisposalTokenRequest):
    """Generate QR disposal token for detected waste item."""
    grade = (req.grade or "GEN").replace(" ", "-")
    rand_code = uuid.uuid4().hex[:6].upper()
    return {"token": f"ECO-{grade}-{rand_code}"}


@app.get("/api/v1/hubs/nearest")
async def get_nearest_hub():
    """Return nearest drop-off hub."""
    return {
        "name": "GreenLoop Recycling Hub",
        "distance_km": 0.8,
        "hours": "Open until 8:00 PM",
        "lat": 26.9124,
        "lng": 75.7873,
    }


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
