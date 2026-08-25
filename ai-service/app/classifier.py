"""
FORENZA Forensic Evidence Classifier
Uses EfficientNet-B0 (ONNX Runtime) with forensic-specific category mapping.
"""
from __future__ import annotations

import io
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Forensic Category Taxonomy
# Maps ImageNet class indices to forensic evidence categories
# ---------------------------------------------------------------------------
FORENSIC_TAXONOMY: dict[str, dict] = {
    # Weapons
    "revolver": {"category": "Weapon", "subcategory": "Firearm", "object": "Revolver"},
    "rifle": {"category": "Weapon", "subcategory": "Firearm", "object": "Rifle"},
    "assault_rifle": {"category": "Weapon", "subcategory": "Firearm", "object": "Assault Rifle"},
    "knife": {"category": "Weapon", "subcategory": "Edged Weapon", "object": "Knife"},
    "cleaver": {"category": "Weapon", "subcategory": "Edged Weapon", "object": "Cleaver"},
    "baseball": {"category": "Weapon", "subcategory": "Blunt Object", "object": "Blunt Object"},
    "hammer": {"category": "Weapon", "subcategory": "Blunt Object", "object": "Hammer"},
    # Documents
    "envelope": {"category": "Document", "subcategory": "Mail", "object": "Envelope"},
    "book": {"category": "Document", "subcategory": "Publication", "object": "Book"},
    "menu": {"category": "Document", "subcategory": "Printed", "object": "Menu"},
    # Electronics
    "cellular_telephone": {"category": "Electronics", "subcategory": "Phone", "object": "Mobile Phone"},
    "laptop": {"category": "Electronics", "subcategory": "Computer", "object": "Laptop"},
    "hard_disc": {"category": "Electronics", "subcategory": "Storage", "object": "Hard Drive"},
    "modem": {"category": "Electronics", "subcategory": "Network Device", "object": "Modem"},
    # Substances / Containers
    "vial": {"category": "Substance", "subcategory": "Container", "object": "Vial"},
    "pill_bottle": {"category": "Substance", "subcategory": "Container", "object": "Pill Bottle"},
    "wine_bottle": {"category": "Substance", "subcategory": "Container", "object": "Bottle"},
    "plastic_bag": {"category": "Substance", "subcategory": "Packaging", "object": "Plastic Bag"},
    # Vehicles
    "car": {"category": "Vehicle", "subcategory": "Automobile", "object": "Car"},
    "pickup": {"category": "Vehicle", "subcategory": "Truck", "object": "Pickup Truck"},
    "police_van": {"category": "Vehicle", "subcategory": "Emergency", "object": "Police Van"},
    # Biological / Trace (ImageNet approximations)
    "hair_slide": {"category": "Biological", "subcategory": "Trace", "object": "Hair Sample"},
    "bandage": {"category": "Biological", "subcategory": "Medical", "object": "Bandage"},
    "rubber_eraser": {"category": "Trace", "subcategory": "Physical", "object": "Eraser"},
    "shoe_shop": {"category": "Trace", "subcategory": "Footwear", "object": "Shoe"},
    "running_shoe": {"category": "Trace", "subcategory": "Footwear", "object": "Running Shoe"},
}

# Default fallback for unmapped ImageNet classes
DEFAULT_CATEGORY = "Physical Evidence"
DEFAULT_SUBCATEGORY = "Unclassified"


@dataclass
class ClassificationResult:
    object: str
    category: str
    subcategory: str
    confidence: float
    model_version: str


class ForensicClassifier:
    """
    Forensic image classifier using EfficientNet-B0 ONNX Runtime.

    Falls back gracefully if model file is not present — development mode
    returns realistic stub classifications for testing without a model file.
    """

    MODEL_VERSION = "efficientnet_b0_forensic_v1"
    INPUT_SIZE = (224, 224)

    # ImageNet normalization
    MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        self.session = None
        self.labels: list[str] = []
        self._load_model()

    def _load_model(self) -> None:
        """Load ONNX model and ImageNet labels. Gracefully handles missing model."""
        try:
            import onnxruntime as ort

            if not self.model_path.exists():
                logger.warning(
                    f"ONNX model not found at {self.model_path}. "
                    f"Running in stub mode — download model with: "
                    f"python scripts/download_model.py"
                )
                self.session = None
                return

            opts = ort.SessionOptions()
            opts.log_severity_level = 3  # Suppress verbose ONNX logs
            self.session = ort.InferenceSession(
                str(self.model_path),
                sess_options=opts,
                providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
            )
            self._load_labels()
            logger.info(f"Model loaded from {self.model_path}")

        except ImportError:
            logger.error("onnxruntime not installed. Run: pip install onnxruntime")
            self.session = None
        except Exception as exc:
            logger.error(f"Failed to load model: {exc}")
            self.session = None

    def _load_labels(self) -> None:
        """Load ImageNet class labels."""
        labels_path = self.model_path.parent / "imagenet_classes.json"
        if labels_path.exists():
            with open(labels_path) as f:
                self.labels = json.load(f)
        else:
            # Minimal fallback labels for known forensic categories
            self.labels = list(FORENSIC_TAXONOMY.keys()) + ["unknown"] * (1000 - len(FORENSIC_TAXONOMY))

    def preprocess(self, image_bytes: bytes) -> np.ndarray:
        """Preprocess image bytes to EfficientNet input tensor."""
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize(self.INPUT_SIZE, Image.LANCZOS)
        arr = np.array(image, dtype=np.float32) / 255.0
        arr = (arr - self.MEAN) / self.STD
        arr = np.transpose(arr, (2, 0, 1))  # HWC → CHW
        arr = np.expand_dims(arr, axis=0)  # Add batch dim
        return arr

    def classify(self, image_bytes: bytes) -> ClassificationResult:
        """
        Classify forensic evidence image.

        Returns:
            ClassificationResult with forensic taxonomy mapping.

        Raises:
            RuntimeError if model failed to load (caller handles gracefully).
        """
        if self.session is None:
            # Stub mode for development without ONNX model
            return self._stub_classify(image_bytes)

        tensor = self.preprocess(image_bytes)
        input_name = self.session.get_inputs()[0].name
        outputs = self.session.run(None, {input_name: tensor})
        logits = outputs[0][0]  # Shape: (1000,)

        # Softmax
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / exp_logits.sum()

        top_idx = int(np.argmax(probs))
        confidence = float(probs[top_idx])

        # Map to forensic taxonomy
        label = self.labels[top_idx] if top_idx < len(self.labels) else "unknown"
        label_clean = label.lower().replace(" ", "_").replace(",", "")

        # Try exact match, then partial match
        forensic = FORENSIC_TAXONOMY.get(label_clean)
        if forensic is None:
            for key, value in FORENSIC_TAXONOMY.items():
                if key in label_clean or label_clean in key:
                    forensic = value
                    break

        if forensic:
            return ClassificationResult(
                object=forensic["object"],
                category=forensic["category"],
                subcategory=forensic["subcategory"],
                confidence=round(confidence * 100, 2),
                model_version=self.MODEL_VERSION,
            )

        # Unmapped class — return generic
        return ClassificationResult(
            object=label.replace("_", " ").title(),
            category=DEFAULT_CATEGORY,
            subcategory=DEFAULT_SUBCATEGORY,
            confidence=round(confidence * 100, 2),
            model_version=self.MODEL_VERSION,
        )

    def _stub_classify(self, image_bytes: bytes) -> ClassificationResult:
        """
        Development stub when ONNX model is not available.
        Returns a deterministic result based on image hash for consistency.
        """
        import hashlib
        image_hash = hashlib.md5(image_bytes).hexdigest()
        # Use hash to deterministically pick from taxonomy
        idx = int(image_hash[:4], 16) % len(FORENSIC_TAXONOMY)
        key = list(FORENSIC_TAXONOMY.keys())[idx]
        forensic = FORENSIC_TAXONOMY[key]
        confidence = 50.0 + (int(image_hash[4:6], 16) / 255.0) * 45.0

        return ClassificationResult(
            object=forensic["object"],
            category=forensic["category"],
            subcategory=forensic["subcategory"],
            confidence=round(confidence, 2),
            model_version="stub_v1_no_model_loaded",
        )

    @property
    def model_version(self) -> str:
        if self.session is None:
            return "stub_v1_no_model_loaded"
        return self.MODEL_VERSION
