"""
Module 04 — processor_entrypoint
Orchestrate grid_detector → bg_remover → sticker_maker for all panels.
Called by Node.js as a child process.

Usage: python processor/process.py <image_path>

stdout: JSON array of sticker file paths (only this, nothing else)
stderr: all logs, warnings, errors
exit 0: success
exit 1: failure
"""
import sys
import os
import json

# Ensure processor/ is on path when called from project root
sys.path.insert(0, os.path.dirname(__file__))

from grid_detector import detect_panels
from bg_remover import remove_background
from sticker_maker import make_sticker


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP_PANELS = os.path.join(BASE_DIR, "tmp", "panels")
TMP_STICKERS = os.path.join(BASE_DIR, "tmp", "stickers")


def main():
    if len(sys.argv) < 2:
        print("Usage: python processor/process.py <image_path>", file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]

    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}", file=sys.stderr)
        sys.exit(1)

    # Ensure tmp directories exist
    os.makedirs(TMP_PANELS, exist_ok=True)
    os.makedirs(TMP_STICKERS, exist_ok=True)

    # Step 1: Detect grid panels
    try:
        panel_paths = detect_panels(image_path, TMP_PANELS)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Grid detection failed: {e}", file=sys.stderr)
        sys.exit(1)

    # Step 2+3: For each panel — remove bg → make sticker
    sticker_paths = []

    for panel_path in panel_paths:
        panel_name = os.path.splitext(os.path.basename(panel_path))[0]
        transparent_path = os.path.join(TMP_PANELS, f"{panel_name}_nobg.png")
        sticker_idx = len(sticker_paths) + 1
        sticker_path = os.path.join(TMP_STICKERS, f"sticker_{sticker_idx:02d}.webp")

        # Background removal
        try:
            remove_background(panel_path, transparent_path)
        except Exception as e:
            print(f"[process] Skipping {panel_name} — bg_remover failed: {e}", file=sys.stderr)
            continue

        # Sticker formatting
        try:
            make_sticker(transparent_path, sticker_path)
            sticker_paths.append(sticker_path)
        except Exception as e:
            print(f"[process] Skipping {panel_name} — sticker_maker failed: {e}", file=sys.stderr)
            continue

    if len(sticker_paths) == 0:
        print("All panels failed to process", file=sys.stderr)
        sys.exit(1)

    # Output: exactly one JSON line to stdout
    print(json.dumps(sticker_paths))
    sys.exit(0)


if __name__ == "__main__":
    main()
