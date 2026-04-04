# Project Dream — TmunoteAI
# Template version: 1.0
# Created by: project-documenter
# Updated by: gap-analyzer (weekly), project-documenter (each session)

project: 10_TmunoteAI
status: building
last_updated: 2026-04-04

---

dream_state:
  privacy: 100% local — no data leaves the machine
  cost: zero recurring — no API key, no cloud, model downloaded once
  quality: photorealistic results from a short Hebrew/English prompt
  speed: generation under 30s on NVIDIA GPU
  usability: one-click launch, results visible in browser within 5 seconds of submit
  reliability: no crashes during multi-image sessions
  extensibility: swap model (v1.5 → v2.1 → SDXL) without rewriting server

current_state:
  privacy: achieved — fully local Stable Diffusion v1.5
  cost: achieved — free, no API key
  quality: untested — code complete, not yet run
  speed: unknown — depends on hardware (CUDA vs CPU)
  usability: one-click via run_web.bat; browser auto-opens
  reliability: untested
  extensibility: model path hardcoded — would need minor server.py edit to swap

gaps:
  - First run not yet validated (Python + GPU required)
  - Speed on CPU unknown — could be 2-5 minutes per image
  - No model switcher UI — hardcoded to v1.5
  - No EXE packaging — requires Python installed
  - No prompt history search — only gallery scroll
  - img2img strength slider not yet in web UI (hardcoded 0.75)

evolution_suggestions:
  # Added by gap-analyzer when status = evolution

upgrade_queue:
  - model switcher (v1.5 / v2.1 / SDXL) via dropdown in web UI — LOW
  - EXE packaging via PyInstaller — MEDIUM (Shalev prefers portable tools)
  - ESRGAN upscaling for low-res outputs — LOW
  - prompt history search/filter — LOW
  - img2img strength slider in web UI — MEDIUM

next_gap_review: 2026-04-11
