#!/usr/bin/env python3
"""
Download EfficientNet-B0 ONNX model and ImageNet class labels.
Run once before starting the AI service:
    python scripts/download_model.py
"""
import os
import json
import hashlib
import urllib.request
from pathlib import Path

MODELS_DIR = Path(__file__).parent.parent / "models"

# EfficientNet-B0 ONNX from ONNX Model Zoo
MODEL_URL = "https://github.com/onnx/models/raw/main/validated/vision/classification/efficientnet-lite4/model/efficientnet-lite4-11.onnx"
MODEL_FILENAME = "efficientnet_b0.onnx"

# ImageNet class labels (simplified)
IMAGENET_LABELS_URL = "https://raw.githubusercontent.com/anishathalye/imagenet-simple-labels/master/imagenet-simple-labels.json"
LABELS_FILENAME = "imagenet_classes.json"


def download_file(url: str, dest: Path, description: str) -> None:
    print(f"Downloading {description}...")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, dest, reporthook=progress_hook)
    print(f"\n✓ Saved to {dest}")


def progress_hook(count, block_size, total_size):
    if total_size > 0:
        percent = min(count * block_size * 100 // total_size, 100)
        print(f"\r  Progress: {percent}%", end="", flush=True)


def main():
    model_path = MODELS_DIR / MODEL_FILENAME
    labels_path = MODELS_DIR / LABELS_FILENAME

    if not model_path.exists():
        download_file(MODEL_URL, model_path, "EfficientNet-B0 ONNX model")
    else:
        print(f"✓ Model already exists: {model_path}")

    if not labels_path.exists():
        download_file(IMAGENET_LABELS_URL, labels_path, "ImageNet class labels")
    else:
        print(f"✓ Labels already exist: {labels_path}")

    print("\nForensa AI service model setup complete.")
    print("Start the service with: uvicorn app.main:app --reload")


if __name__ == "__main__":
    main()
