# Module 03 — Production Pipeline

## Objective
Define the tools, workflow, and output specifications for producing each episode.

## Active Pipeline (confirmed decisions)
Budget: Zero | Voiceover: Automatic Hebrew TTS (two voices) | Distribution: WhatsApp (9:16 vertical)

| Step | Tool | Notes |
|---|---|---|
| Script generation | Anthropic API (Claude) | JSON structured output per scene |
| Animation | Web interface canvas | 5 scenes, synchronized with audio |
| TTS voiceover | Browser Web Speech API or equivalent | Two voices: child + animal |
| Background music | Royalty-free children's track | Embedded or CDN, low volume |
| Recording | Browser MediaRecorder | Canvas + audio combined |
| Output | WebM download | Direct WhatsApp compatible |

## Workflow Per Episode
1. Open web interface (web-interface/index.html) in Chrome or Firefox
2. Enter Anthropic API key once per session
3. Type topic in Hebrew
4. Click "צור סרטון" — one click, no further steps
5. Interface generates script, synthesizes Hebrew TTS, loads background music
6. Animation plays automatically with synchronized voice and music
7. Video is recorded in the background
8. Click "הורד סרטון" — send via WhatsApp

## Output Specifications
- Format: WebM (downloaded from web interface) — WhatsApp accepts this directly
- Resolution: 360×640 px display (9:16 vertical, optimized for WhatsApp)
- Audio: user's recorded voice (via web interface mic recording)
- File naming: automatic — kesem_hayedia_[topic].webm

## Music
- Source: royalty-free only (Pixabay Music, Uppbeat, YouTube Audio Library)
- Style: light, warm, children's instrumental
- Volume: -10 to -15 dB under voiceover
