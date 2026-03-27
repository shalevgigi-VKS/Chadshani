"""
Module 01 — grid_detector
Detect and crop individual panels from a grid image.
"""
import sys
import os
import cv2
import numpy as np


def detect_panels(image_path: str, output_dir: str) -> list[str]:
    """
    Load image, detect grid panels via white-space gaps, crop each panel.

    Args:
        image_path: path to source grid image
        output_dir: directory to save cropped panel PNGs

    Returns:
        List of saved panel file paths in reading order (left-to-right, top-to-bottom)

    Raises:
        ValueError: if image is unreadable or no valid panels detected
        IOError: if output directory is not writable
    """
    # Load image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Cannot read image: {image_path}")

    # Ensure output dir exists
    os.makedirs(output_dir, exist_ok=True)

    # Test write access
    test_path = os.path.join(output_dir, ".write_test")
    try:
        with open(test_path, "w") as f:
            f.write("")
        os.remove(test_path)
    except Exception:
        raise IOError(f"Output directory not writable: {output_dir}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape

    # Threshold — white/near-white pixels become 255, others 0
    _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)

    # Horizontal projection — mean white pixel ratio per row
    h_proj = np.mean(binary, axis=1) / 255.0  # shape: (height,)

    # Vertical projection — mean white pixel ratio per column
    v_proj = np.mean(binary, axis=0) / 255.0  # shape: (width,)

    gap_threshold = 0.90  # rows/cols where >90% pixels are white = gap

    row_gaps = _find_gap_ranges(h_proj, gap_threshold)
    col_gaps = _find_gap_ranges(v_proj, gap_threshold)

    # Convert gap ranges to panel boundaries
    row_bounds = _gaps_to_bounds(row_gaps, 0, height)
    col_bounds = _gaps_to_bounds(col_gaps, 0, width)

    print(f"[grid_detector] Detected {len(row_bounds)} row(s), {len(col_bounds)} col(s)", file=sys.stderr)

    MIN_SIZE = 100
    saved_paths = []
    panel_idx = 1
    discarded = 0

    for r_start, r_end in row_bounds:
        for c_start, c_end in col_bounds:
            panel_h = r_end - r_start
            panel_w = c_end - c_start

            if panel_w < MIN_SIZE or panel_h < MIN_SIZE:
                discarded += 1
                continue

            panel = img[r_start:r_end, c_start:c_end]
            filename = f"panel_{panel_idx:02d}.png"
            out_path = os.path.join(output_dir, filename)
            cv2.imwrite(out_path, panel)

            if not os.path.exists(out_path):
                print(f"[grid_detector] WARNING: failed to save {out_path}", file=sys.stderr)
                continue

            saved_paths.append(out_path)
            panel_idx += 1

    if discarded > 0:
        print(f"[grid_detector] Discarded {discarded} panel(s) below minimum size", file=sys.stderr)

    if len(saved_paths) == 0:
        raise ValueError("No panels detected in image")

    print(f"[grid_detector] Saved {len(saved_paths)} panel(s)", file=sys.stderr)
    return saved_paths


def _find_gap_ranges(projection: np.ndarray, threshold: float) -> list[tuple[int, int]]:
    """Find contiguous ranges where projection >= threshold (white gaps)."""
    gaps = []
    in_gap = False
    start = 0

    for i, val in enumerate(projection):
        if val >= threshold and not in_gap:
            in_gap = True
            start = i
        elif val < threshold and in_gap:
            in_gap = False
            gaps.append((start, i))

    if in_gap:
        gaps.append((start, len(projection)))

    return gaps


def _gaps_to_bounds(gaps: list[tuple[int, int]], total_start: int, total_end: int) -> list[tuple[int, int]]:
    """Convert gap ranges to panel boundary pairs."""
    # Build list of non-gap segments
    boundaries = []
    prev = total_start

    for gap_start, gap_end in gaps:
        if gap_start > prev:
            boundaries.append((prev, gap_start))
        prev = gap_end

    if prev < total_end:
        boundaries.append((prev, total_end))

    return boundaries
