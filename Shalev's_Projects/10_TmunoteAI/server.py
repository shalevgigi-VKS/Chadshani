import os
import io
import base64
import json
import threading
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, render_template
from PIL import Image

app = Flask(__name__)

MODEL_ID = "runwayml/stable-diffusion-v1-5"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Global state
pipe = None
img2img_pipe = None
model_ready = False
model_status = "טוען מודל AI..."
gen_lock = threading.Lock()


def load_model():
    global pipe, img2img_pipe, model_ready, model_status
    try:
        import torch
        from diffusers import StableDiffusionPipeline, StableDiffusionImg2ImgPipeline

        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32
        model_status = f"מוריד/טוען מודל ({device.upper()}) — בפעם הראשונה ~4 GB..."

        pipe = StableDiffusionPipeline.from_pretrained(MODEL_ID, torch_dtype=dtype)
        pipe = pipe.to(device)

        # Share weights with img2img pipeline (no extra memory)
        img2img_pipe = StableDiffusionImg2ImgPipeline(**pipe.components)

        model_ready = True
        model_status = f"מוכן ({device.upper()})"
    except Exception as e:
        model_status = f"שגיאה בטעינה: {e}"


threading.Thread(target=load_model, daemon=True).start()


# ── Routes ──────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/status")
def status():
    return jsonify({"ready": model_ready, "status": model_status})


@app.route("/api/generate", methods=["POST"])
def generate():
    if not model_ready:
        return jsonify({"error": "המודל עדיין נטען — נסה שוב בעוד רגע"}), 503
    if gen_lock.locked():
        return jsonify({"error": "כבר מייצר תמונה — המתן לסיום"}), 429

    data = request.get_json(force=True)
    prompt = (data.get("prompt") or "").strip()
    negative_prompt = (data.get("negative_prompt") or "").strip() or None
    steps = max(10, min(50, int(data.get("steps", 25))))
    width = int(data.get("width", 512))
    height = int(data.get("height", 512))
    auto_save = bool(data.get("auto_save", True))

    if not prompt:
        return jsonify({"error": "חסר תיאור (prompt)"}), 400

    with gen_lock:
        try:
            result = pipe(
                prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=steps,
                width=width,
                height=height,
            )
            image = result.images[0]
            filename = _save_image(image, prompt, negative_prompt, steps, width, height) if auto_save else None
            return jsonify({"image": _to_b64(image), "filename": filename})
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@app.route("/api/img2img", methods=["POST"])
def img2img():
    if not model_ready:
        return jsonify({"error": "המודל עדיין נטען"}), 503
    if gen_lock.locked():
        return jsonify({"error": "כבר מייצר תמונה — המתן לסיום"}), 429

    if "image" not in request.files:
        return jsonify({"error": "חסרה תמונת קלט"}), 400

    prompt = (request.form.get("prompt") or "").strip()
    negative_prompt = (request.form.get("negative_prompt") or "").strip() or None
    steps = max(10, min(50, int(request.form.get("steps", 25))))
    strength = max(0.1, min(1.0, float(request.form.get("strength", 0.75))))

    if not prompt:
        return jsonify({"error": "חסר תיאור (prompt)"}), 400

    with gen_lock:
        try:
            init_img = Image.open(request.files["image"]).convert("RGB").resize((512, 512))
            result = img2img_pipe(
                prompt=prompt,
                image=init_img,
                negative_prompt=negative_prompt,
                num_inference_steps=steps,
                strength=strength,
            )
            image = result.images[0]
            filename = _save_image(image, prompt, negative_prompt, steps, 512, 512)
            return jsonify({"image": _to_b64(image), "filename": filename})
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@app.route("/api/history")
def history():
    items = []
    for fname in sorted(os.listdir(OUTPUT_DIR), reverse=True):
        if not fname.endswith(".png"):
            continue
        txt = fname.replace(".png", ".txt")
        prompt_preview = ""
        txt_path = os.path.join(OUTPUT_DIR, txt)
        if os.path.exists(txt_path):
            with open(txt_path, encoding="utf-8") as f:
                prompt_preview = f.readline().replace("Prompt: ", "")[:100]
        items.append({"filename": fname, "prompt_preview": prompt_preview})
        if len(items) >= 30:
            break
    return jsonify(items)


@app.route("/output/<path:filename>")
def serve_output(filename):
    return send_from_directory(OUTPUT_DIR, filename)


# ── Helpers ─────────────────────────────────────────────────────────────

def _to_b64(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _save_image(image, prompt, negative_prompt, steps, width, height) -> str:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    img_path = os.path.join(OUTPUT_DIR, f"{ts}.png")
    log_path = os.path.join(OUTPUT_DIR, f"{ts}.txt")
    image.save(img_path)
    with open(log_path, "w", encoding="utf-8") as f:
        f.write(f"Prompt: {prompt}\n")
        f.write(f"Negative: {negative_prompt or ''}\n")
        f.write(f"Steps: {steps} | Size: {width}x{height}\n")
    return f"{ts}.png"


# ── Entrypoint ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import webbrowser, time

    def _open_browser():
        time.sleep(1.5)
        webbrowser.open("http://127.0.0.1:5000")

    threading.Thread(target=_open_browser, daemon=True).start()
    print("מפעיל שרת מקומי: http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
