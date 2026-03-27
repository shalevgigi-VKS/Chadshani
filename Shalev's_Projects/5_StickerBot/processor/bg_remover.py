"""
Module 02 — bg_remover
Remove background from a single panel image using rembg (u2net model).
"""
import sys
import os
from PIL import Image
from rembg import remove


def remove_background(input_path: str, output_path: str) -> str:
    """
    Remove background from panel image, output transparent RGBA PNG.

    Args:
        input_path: path to source panel PNG
        output_path: where to save the transparent PNG

    Returns:
        output_path on success

    Raises:
        FileNotFoundError: if input_path does not exist
        Exception: re-raised if rembg fails (caller handles per-panel skip)
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input not found: {input_path}")

    # Inform user on first run that model download is expected
    print(f"[bg_remover] Processing: {os.path.basename(input_path)}", file=sys.stderr)
    print("[bg_remover] (First run downloads ~170MB u2net model — this is expected)", file=sys.stderr)

    with Image.open(input_path) as img:
        img_rgba = img.convert("RGBA")
        result = remove(img_rgba)

    # Verify alpha channel
    if result.mode != "RGBA":
        result = result.convert("RGBA")

    # Validate dimensions match input
    with Image.open(input_path) as original:
        orig_size = original.size

    if result.size != orig_size:
        result = result.resize(orig_size, Image.LANCZOS)

    result.save(output_path, format="PNG")

    if not os.path.exists(output_path):
        raise IOError(f"Failed to save output: {output_path}")

    print(f"[bg_remover] Saved transparent PNG: {os.path.basename(output_path)}", file=sys.stderr)
    return output_path
