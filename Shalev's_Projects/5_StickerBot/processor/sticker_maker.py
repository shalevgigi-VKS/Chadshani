"""
Module 03 — sticker_maker
Add white 8px border stroke, resize to 512x512, export as WebP sticker.
"""
import sys
import os
import numpy as np
from PIL import Image, ImageFilter


STICKER_SIZE = 512
STROKE_WIDTH = 8
TARGET_KB = 100


def make_sticker(input_path: str, output_path: str) -> str:
    """
    Convert transparent PNG to a WhatsApp-compatible WebP sticker.

    Args:
        input_path: path to transparent RGBA PNG (output of bg_remover)
        output_path: where to save the WebP sticker

    Returns:
        output_path on success

    Raises:
        FileNotFoundError: if input_path does not exist
        IOError: if output cannot be written
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input not found: {input_path}")

    with Image.open(input_path) as img:
        img = img.convert("RGBA")
        img_with_stroke = _add_white_stroke(img, STROKE_WIDTH)
        img_resized = _resize_to_canvas(img_with_stroke, STICKER_SIZE)

    _export_webp(img_resized, output_path)
    print(f"[sticker_maker] Saved WebP sticker: {os.path.basename(output_path)}", file=sys.stderr)
    return output_path


def _add_white_stroke(img: Image.Image, stroke_px: int) -> Image.Image:
    """Dilate alpha mask by stroke_px and composite white behind character."""
    r, g, b, a = img.split()

    # Convert alpha to numpy for dilation
    alpha_np = np.array(a)

    # Dilation kernel: create a disk of radius stroke_px
    kernel_size = stroke_px * 2 + 1
    y, x = np.ogrid[-stroke_px:stroke_px + 1, -stroke_px:stroke_px + 1]
    kernel = (x ** 2 + y ** 2 <= stroke_px ** 2).astype(np.uint8)

    # Dilate via max filter approximation using PIL MaxFilter
    # Use PIL's built-in MaxFilter (radius = stroke_px)
    alpha_img = Image.fromarray(alpha_np, mode="L")
    dilated_alpha = alpha_img.filter(ImageFilter.MaxFilter(kernel_size))

    # Create white layer same size
    white_layer = Image.new("RGBA", img.size, (255, 255, 255, 255))

    # Composite: white visible only in dilated area outside original alpha
    stroke_mask = Image.fromarray(np.array(dilated_alpha), mode="L")

    result = Image.new("RGBA", img.size, (0, 0, 0, 0))
    result.paste(white_layer, mask=stroke_mask)
    result.paste(img, mask=a)

    return result


def _resize_to_canvas(img: Image.Image, canvas_size: int) -> Image.Image:
    """Fit image within canvas_size×canvas_size preserving aspect ratio, centered."""
    orig_w, orig_h = img.size
    scale = min(canvas_size / orig_w, canvas_size / orig_h)
    new_w = int(orig_w * scale)
    new_h = int(orig_h * scale)

    resized = img.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    offset_x = (canvas_size - new_w) // 2
    offset_y = (canvas_size - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)

    return canvas


def _export_webp(img: Image.Image, output_path: str) -> None:
    """Save as WebP, retry with lower quality if over 100KB."""
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    for quality in [90, 70]:
        img.save(output_path, format="WEBP", quality=quality, method=6)
        size_kb = os.path.getsize(output_path) / 1024

        if size_kb <= TARGET_KB:
            return

        if quality == 70:
            print(
                f"[sticker_maker] WARNING: {os.path.basename(output_path)} is {size_kb:.1f}KB (over {TARGET_KB}KB limit)",
                file=sys.stderr,
            )
            return

    raise IOError(f"Cannot write output: {output_path}")
