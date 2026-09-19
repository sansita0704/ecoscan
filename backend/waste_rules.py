"""
Waste Sorting and Recycling Rules for EcoScan AI.
Maps model class names to frontend display contracts:
- label: Human-friendly name
- category: Sorting category (Recyclable / Landfill / Hazardous / Compost)
- weight_g: Average weight estimate in grams
- material_grade: Material classification standard (e.g. PET-01, ALU-41)
- contamination: { level, label, score (0..1) }
- steps: Actionable preparation steps checklist
"""

import copy

WASTE_RULES = {
    "plastic_bottle": {
        "label": "PET Plastic Bottle",
        "category": "Dry / Recyclable",
        "weight_g": 28.5,
        "material_grade": "PET-01",
        "contamination": {"level": "Low", "label": "Clean", "score": 0.12},
        "steps": [
            "Empty liquid completely and rinse lightly.",
            "Unscrew plastic cap & remove collar.",
            "Crush bottle flat to save bin space.",
            "Deposit in Blue Dry-Waste / Plastic Bin.",
        ],
    },
    "wrapper": {
        "label": "Food Wrapper / Film",
        "category": "Non-Recyclable / Landfill",
        "weight_g": 5.0,
        "material_grade": "Multi-layer Plastic",
        "contamination": {"level": "Medium", "label": "Greasy Residue", "score": 0.48},
        "steps": [
            "Shake out crumbs and solid food bits.",
            "Multi-layer film cannot be mechanically recycled curbside.",
            "Dispose in General Waste / Landfill Bin.",
        ],
    },
    "can": {
        "label": "Aluminum Beverage Can",
        "category": "Dry / Recyclable",
        "weight_g": 14.8,
        "material_grade": "ALU-41",
        "contamination": {"level": "Low", "label": "Rinsed", "score": 0.08},
        "steps": [
            "Rinse out leftover beverage residues.",
            "Keep pop tab attached if possible.",
            "Dispose in Metal / Recyclables Bin.",
        ],
    },
    "carton": {
        "label": "Beverage / Liquid Carton",
        "category": "Dry / Recyclable",
        "weight_g": 32.0,
        "material_grade": "TetraPak / PAP-21",
        "contamination": {"level": "Low", "label": "Rinsed", "score": 0.15},
        "steps": [
            "Empty all residual liquid.",
            "Unfold corners and flatten carton completely.",
            "Place in Paper & Carton Recycling Bin.",
        ],
    },
    "cup": {
        "label": "Disposable Coffee / Drink Cup",
        "category": "Mixed / Landfill",
        "weight_g": 12.0,
        "material_grade": "PAP-PE Composite",
        "contamination": {"level": "Medium", "label": "Liquid Residue", "score": 0.38},
        "steps": [
            "Separate plastic lid and cardboard sleeve.",
            "Sleeve goes to paper recycling; lid to plastic recycling.",
            "Poly-coated paper cup body goes to General Waste.",
        ],
    },
    "bottle_cap": {
        "label": "Plastic Bottle Cap",
        "category": "Dry / Recyclable",
        "weight_g": 2.8,
        "material_grade": "HDPE-02",
        "contamination": {"level": "Low", "label": "Clean", "score": 0.05},
        "steps": [
            "Separate cap from the bottle.",
            "Rinse if sticky with syrup or dairy.",
            "Place in Plastics Recycling Bin.",
        ],
    },
    "glass_bottle": {
        "label": "Glass Bottle / Jar",
        "category": "Dry / Recyclable",
        "weight_g": 210.0,
        "material_grade": "GL-70",
        "contamination": {"level": "Low", "label": "Clean", "score": 0.10},
        "steps": [
            "Rinse bottle clean of contents.",
            "Remove metal crown or plastic cap.",
            "Place gently in Glass Drop-off Bin.",
        ],
    },
    "straw": {
        "label": "Plastic Straw",
        "category": "Non-Recyclable / Landfill",
        "weight_g": 1.2,
        "material_grade": "PP-05 Single-Use",
        "contamination": {"level": "High", "label": "Single-use Plastic", "score": 0.65},
        "steps": [
            "Plastic straws are too light for optical recycling sorters.",
            "Do not place in curbside recycling bins.",
            "Dispose in Landfill / General Waste.",
        ],
    },
    "broken_glass": {
        "label": "Broken Glass Shards",
        "category": "Hazardous / Safe Disposal",
        "weight_g": 140.0,
        "material_grade": "GL-Hazardous",
        "contamination": {"level": "High", "label": "Sharp Hazard", "score": 0.90},
        "steps": [
            "CAUTION: Sharp edges - handle with puncture-resistant gloves.",
            "Wrap tightly in heavy newspaper or a cardboard box.",
            "Tape securely and label clearly as 'BROKEN GLASS'.",
            "Dispose safely in Designated Sharp/Hazardous Waste.",
        ],
    },
    "styrofoam": {
        "label": "Styrofoam Container / EPS",
        "category": "Non-Recyclable / Landfill",
        "weight_g": 7.5,
        "material_grade": "PS-06",
        "contamination": {"level": "High", "label": "Grease Contaminated", "score": 0.72},
        "steps": [
            "Wipe off excess food waste.",
            "Expanded polystyrene is not accepted in curbside recycling.",
            "Break into pieces and place in Landfill Waste Bin.",
        ],
    },
    "pop_tab": {
        "label": "Aluminum Can Pop Tab",
        "category": "Dry / Recyclable",
        "weight_g": 0.5,
        "material_grade": "ALU-41",
        "contamination": {"level": "Low", "label": "Clean", "score": 0.03},
        "steps": [
            "Leave attached to can or collect multiple tabs inside an empty can.",
            "Dispose in Metal Recyclables Bin.",
        ],
    },
}

DEFAULT_RULE = {
    "label": "Unclassified Item",
    "category": "General Waste",
    "weight_g": 15.0,
    "material_grade": "OTHER-07",
    "contamination": {"level": "Medium", "label": "Unknown", "score": 0.30},
    "steps": [
        "Inspect item material type.",
        "Check local community recycling guidelines.",
        "If unsure, place in General Waste to avoid contamination.",
    ],
}


# Alternate class names seen in TACO-derived label sets, mapped onto the rules above
# so a retrained/swapped checkpoint keeps returning real guidance instead of the fallback.
CLASS_ALIASES = {
    "bottle": "plastic_bottle",
    "clear_plastic_bottle": "plastic_bottle",
    "other_plastic_bottle": "plastic_bottle",
    "plastic_bottle_cap": "bottle_cap",
    "metal_bottle_cap": "bottle_cap",
    "drink_can": "can",
    "food_can": "can",
    "aluminium_can": "can",
    "aluminum_can": "can",
    "tin_can": "can",
    "drink_carton": "carton",
    "tetra_pak": "carton",
    "paper_cup": "cup",
    "disposable_plastic_cup": "cup",
    "plastic_cup": "cup",
    "glass_jar": "glass_bottle",
    "plastic_film": "wrapper",
    "crisp_packet": "wrapper",
    "plastic_wrapper": "wrapper",
    "snack_wrapper": "wrapper",
    "drinking_straw": "straw",
    "plastic_straw": "straw",
    "broken_glass_piece": "broken_glass",
    "glass_shard": "glass_bottle",
    "foam_container": "styrofoam",
    "styrofoam_piece": "styrofoam",
    "polystyrene": "styrofoam",
    "aluminium_foil": "pop_tab",
}


def normalize_class_name(class_name: str) -> str:
    """Lower-case, underscore-separated form of a model class name."""
    cleaned = str(class_name).lower().strip()
    for ch in (" ", "-", "/"):
        cleaned = cleaned.replace(ch, "_")
    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")
    return cleaned.strip("_")


def get_waste_rule(class_name: str) -> dict:
    """Return the waste sorting rule and disposal guide for a detected class.

    The returned dict is a deep copy: callers mutate the response per request,
    and the nested `contamination` dict would otherwise be shared module state.
    """
    cleaned_name = normalize_class_name(class_name)
    key = cleaned_name if cleaned_name in WASTE_RULES else CLASS_ALIASES.get(cleaned_name)
    base = WASTE_RULES.get(key) if key else None
    if base:
        return copy.deepcopy(base)
    fallback = copy.deepcopy(DEFAULT_RULE)
    fallback["label"] = cleaned_name.replace("_", " ").title() or DEFAULT_RULE["label"]
    return fallback
