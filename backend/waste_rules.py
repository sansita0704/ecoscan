"""
Waste Sorting and Bin Routing Rules for EcoScan AI.

Source of truth is bin_mapping.json (the 22-class taxonomy from the
fine-tuned YOLOv8 checkpoint), keyed by the model's own class names:
- bin: sorting/bin destination shown to the user, e.g. "Dry / Recyclable"
- color: hex accent colour for this class's bounding box / bin card
- tip: one-line disposal guidance
- is_hazardous: true if this class needs special/hazardous handling
"""

import copy
import json
import logging
from pathlib import Path

logger = logging.getLogger("ecoscan")

BASE_DIR = Path(__file__).resolve().parent
BIN_MAPPING_PATH = BASE_DIR / "bin_mapping.json"

DEFAULT_RULE = {
    "bin": "General / Unclassified",
    "color": "#94A3B8",
    "tip": "Not in the configured bin mapping. Check local guidance before disposal.",
    "is_hazardous": False,
}


def _load_bin_mapping() -> dict:
    try:
        with open(BIN_MAPPING_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            raise ValueError("bin_mapping.json must contain a JSON object")
        logger.info("Loaded bin_mapping.json with %d classes", len(data))
        return data
    except FileNotFoundError:
        logger.warning("bin_mapping.json not found at %s; using empty rule table", BIN_MAPPING_PATH)
        return {}
    except (ValueError, json.JSONDecodeError):
        logger.exception("Failed to parse bin_mapping.json; using empty rule table")
        return {}


BIN_MAPPING = _load_bin_mapping()

# The 22-class taxonomy the current checkpoint was fine-tuned on. Kept for
# reference/validation against whatever names the checkpoint itself reports.
CLASS_NAMES = [
    "battery", "can", "cardboard_bowl", "cardboard_box", "chemical_plastic_bottle",
    "chemical_plastic_gallon", "chemical_spray_can", "light_bulb", "paint_bucket",
    "plastic_bag", "plastic_bottle", "plastic_bottle_cap", "plastic_box",
    "plastic_cultery", "plastic_cup", "plastic_cup_lid", "reuseable_paper",
    "scrap_paper", "scrap_plastic", "snack_bag", "stick", "straw",
]


def normalize_class_name(class_name: str) -> str:
    """Lower-case, underscore-separated form of a model class name."""
    cleaned = str(class_name).lower().strip()
    for ch in (" ", "-", "/"):
        cleaned = cleaned.replace(ch, "_")
    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")
    return cleaned.strip("_")


def display_name(class_name: str) -> str:
    """Human-friendly label for a model class name, e.g. 'plastic_bottle' -> 'Plastic Bottle'."""
    cleaned = normalize_class_name(class_name)
    return cleaned.replace("_", " ").title() if cleaned else str(class_name)


def get_bin_rule(class_name: str) -> dict:
    """Return the bin-routing rule for a detected class.

    The returned dict is a deep copy: callers mutate the response per request,
    and the DEFAULT_RULE dict would otherwise be shared module state.
    """
    cleaned_name = normalize_class_name(class_name)
    rule = BIN_MAPPING.get(cleaned_name) or BIN_MAPPING.get(class_name)
    if rule:
        return copy.deepcopy(rule)
    return copy.deepcopy(DEFAULT_RULE)


# --- Backward-compatible aliases -------------------------------------------------
# main.py previously imported WASTE_RULES / get_waste_rule from this module.
WASTE_RULES = BIN_MAPPING


def get_waste_rule(class_name: str) -> dict:
    """Deprecated alias for get_bin_rule(), kept so older imports don't break."""
    return get_bin_rule(class_name)
