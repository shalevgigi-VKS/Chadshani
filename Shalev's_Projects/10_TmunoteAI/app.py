import customtkinter as ctk
from tkinter import filedialog, messagebox
import threading

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

MODEL_ID = "runwayml/stable-diffusion-v1-5"


class ImageGeneratorApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("מחולל תמונות AI")
        self.geometry("760x700")
        self.resizable(False, False)

        self.pipe = None
        self.generated_image = None

        self._build_ui()
        threading.Thread(target=self._load_model, daemon=True).start()

    def _build_ui(self):
        # Header
        self.status_label = ctk.CTkLabel(
            self, text="טוען מודל AI — נא להמתין...",
            font=ctk.CTkFont(size=14), text_color="gray"
        )
        self.status_label.pack(pady=(16, 0))

        ctk.CTkLabel(
            self, text="מחולל תמונות AI",
            font=ctk.CTkFont(size=26, weight="bold")
        ).pack(pady=(4, 12))

        # Prompt
        ctk.CTkLabel(self, text="תיאור התמונה (באנגלית):").pack(anchor="w", padx=30)
        self.prompt_input = ctk.CTkTextbox(self, height=70, width=700, wrap="word")
        self.prompt_input.pack(padx=30, pady=(4, 10))

        # Negative prompt
        ctk.CTkLabel(self, text="מה לא לכלול בתמונה (Negative prompt, אופציונלי):").pack(anchor="w", padx=30)
        self.neg_prompt_input = ctk.CTkTextbox(self, height=45, width=700, wrap="word")
        self.neg_prompt_input.pack(padx=30, pady=(4, 12))

        # Steps slider
        slider_frame = ctk.CTkFrame(self, fg_color="transparent")
        slider_frame.pack(padx=30, fill="x")
        ctk.CTkLabel(slider_frame, text="צעדי איכות:").pack(side="left")
        self.steps_value_label = ctk.CTkLabel(slider_frame, text="25", width=30)
        self.steps_value_label.pack(side="right")
        self.steps_slider = ctk.CTkSlider(
            slider_frame, from_=10, to=50, number_of_steps=40,
            command=self._on_steps_change
        )
        self.steps_slider.set(25)
        self.steps_slider.pack(side="left", fill="x", expand=True, padx=10)

        # Buttons
        btn_frame = ctk.CTkFrame(self, fg_color="transparent")
        btn_frame.pack(pady=14)
        self.generate_btn = ctk.CTkButton(
            btn_frame, text="צור תמונה", width=180, height=40,
            state="disabled", command=self._start_generation
        )
        self.generate_btn.pack(side="left", padx=8)
        self.save_btn = ctk.CTkButton(
            btn_frame, text="שמור תמונה", width=180, height=40,
            state="disabled", fg_color="#2e7d32", hover_color="#388e3c",
            command=self._save_image
        )
        self.save_btn.pack(side="left", padx=8)

        # Image display
        self.image_label = ctk.CTkLabel(
            self, text="התמונה תופיע כאן",
            width=512, height=512,
            fg_color="#1e1e2e", corner_radius=10
        )
        self.image_label.pack(pady=(0, 16))

    def _on_steps_change(self, value):
        self.steps_value_label.configure(text=str(int(value)))

    def _load_model(self):
        try:
            import torch
            from diffusers import StableDiffusionPipeline

            device = "cuda" if torch.cuda.is_available() else "cpu"
            dtype = torch.float16 if device == "cuda" else torch.float32

            self._set_status(f"מוריד/טוען מודל ({device.upper()})... (בפעם הראשונה: ~4 GB)")

            pipe = StableDiffusionPipeline.from_pretrained(MODEL_ID, torch_dtype=dtype)
            pipe = pipe.to(device)

            self.pipe = pipe
            self._set_status(f"המודל מוכן ({device.upper()})")
            self.generate_btn.configure(state="normal")

        except Exception as e:
            self._set_status(f"שגיאה בטעינת המודל: {e}")

    def _set_status(self, text):
        self.status_label.configure(text=text)

    def _start_generation(self):
        prompt = self.prompt_input.get("0.0", "end").strip()
        if not prompt:
            messagebox.showwarning("חסר מידע", "הזן תיאור לתמונה לפני הלחיצה.")
            return

        self.generate_btn.configure(state="disabled", text="מייצר תמונה...")
        self.save_btn.configure(state="disabled")
        self.image_label.configure(image=None, text="מייצר... נא להמתין")
        self._set_status("יוצר תמונה...")

        neg = self.neg_prompt_input.get("0.0", "end").strip() or None
        steps = int(self.steps_slider.get())

        threading.Thread(target=self._generate, args=(prompt, neg, steps), daemon=True).start()

    def _generate(self, prompt, negative_prompt, steps):
        try:
            result = self.pipe(
                prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=steps,
            )
            image = result.images[0]
            self.generated_image = image

            ctk_image = ctk.CTkImage(light_image=image, dark_image=image, size=(512, 512))
            self.image_label.configure(image=ctk_image, text="")
            self.save_btn.configure(state="normal")
            self._set_status("התמונה מוכנה!")

        except Exception as e:
            self._set_status(f"שגיאה ביצירה: {e}")
            self.image_label.configure(image=None, text="אירעה שגיאה")

        finally:
            self.generate_btn.configure(state="normal", text="צור תמונה")

    def _save_image(self):
        if not self.generated_image:
            return
        path = filedialog.asksaveasfilename(
            defaultextension=".png",
            filetypes=[("PNG", "*.png"), ("JPEG", "*.jpg"), ("All files", "*.*")],
            title="שמור תמונה",
            initialfile="AI-Image",
        )
        if path:
            self.generated_image.save(path)
            messagebox.showinfo("נשמר", f"התמונה נשמרה:\n{path}")


if __name__ == "__main__":
    app = ImageGeneratorApp()
    app.mainloop()
