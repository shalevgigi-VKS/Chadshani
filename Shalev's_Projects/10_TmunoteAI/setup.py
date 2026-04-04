"""
setup.py — הכנה מלאה לפרויקט תמונות AI
מוריד את המודל מראש ומוודא שהכל תקין.
הרץ פעם אחת לפני השימוש הראשון.
"""

import subprocess
import sys
import os

REQUIRED = [
    "torch",
    "diffusers",
    "transformers",
    "accelerate",
    "customtkinter",
    "Pillow",
    "flask",
]

MODEL_ID = "runwayml/stable-diffusion-v1-5"


def install_packages():
    print("=" * 52)
    print("  שלב 1: התקנת חבילות Python")
    print("=" * 52)
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade"] + REQUIRED)
    print("\nכל החבילות הותקנו בהצלחה.\n")


def download_model():
    print("=" * 52)
    print("  שלב 2: הורדת מודל Stable Diffusion")
    print("  (רק בפעם הראשונה — כ-4 GB)")
    print("=" * 52)

    import torch
    from diffusers import StableDiffusionPipeline

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32

    print(f"\nמכשיר: {device.upper()}")
    print("מוריד מודל (עשוי לקחת כמה דקות)...\n")

    pipe = StableDiffusionPipeline.from_pretrained(MODEL_ID, torch_dtype=dtype)
    pipe = pipe.to(device)

    print("\nהמודל הורד ונטען בהצלחה!")
    print(f"נשמר ב: ~/.cache/huggingface/hub/\n")

    # Quick sanity test
    print("בודק יצירת תמונה פשוטה (test)...")
    result = pipe("a red apple", num_inference_steps=5)
    test_path = os.path.join(os.path.dirname(__file__), "output", "setup_test.png")
    os.makedirs(os.path.dirname(test_path), exist_ok=True)
    result.images[0].save(test_path)
    print(f"תמונת בדיקה נשמרה: {test_path}")
    print("\nהכל עובד! אפשר להפעיל את האפליקציה.\n")


def show_instructions():
    print("=" * 52)
    print("  הכנה הושלמה! איך להפעיל:")
    print("=" * 52)
    print()
    print("  אתר מקומי (מומלץ):")
    print("    python server.py")
    print("    או: לחיצה כפולה על run_web.bat")
    print()
    print("  אפליקציית Windows:")
    print("    python app.py")
    print("    או: לחיצה כפולה על run.bat")
    print()


if __name__ == "__main__":
    try:
        install_packages()
        download_model()
        show_instructions()
    except KeyboardInterrupt:
        print("\nהופסק על ידי המשתמש.")
    except Exception as e:
        print(f"\nשגיאה: {e}")
        print("ודא שיש חיבור אינטרנט ונסה שוב.")
        sys.exit(1)
