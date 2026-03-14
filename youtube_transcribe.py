#!/usr/bin/env python3
"""
Pipeline: YouTube URL → audio → text (via yt-dlp + whisper)
Usage: python youtube_transcribe.py <youtube_url> [--model tiny|base|small|medium|large]
"""
import sys
import os
import subprocess
import argparse
import tempfile
import whisper


def transcribe(url: str, model_name: str = "base") -> str:
    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = os.path.join(tmpdir, "audio.mp3")

        print(f"[1/3] Downloading audio from: {url}")
        result = subprocess.run(
            [
                sys.executable, "-m", "yt_dlp",
                "--extract-audio", "--audio-format", "mp3",
                "--audio-quality", "0",
                "--output", audio_path,
                "--no-playlist",
                url,
            ],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            raise RuntimeError(f"yt-dlp failed:\n{result.stderr}")

        # yt-dlp may append extension
        if not os.path.exists(audio_path):
            candidates = [f for f in os.listdir(tmpdir) if f.endswith(".mp3")]
            if not candidates:
                raise RuntimeError("No audio file found after download")
            audio_path = os.path.join(tmpdir, candidates[0])

        print(f"[2/3] Loading Whisper model: {model_name}")
        model = whisper.load_model(model_name)

        print("[3/3] Transcribing...")
        result = model.transcribe(audio_path)
        return result["text"]


def main():
    parser = argparse.ArgumentParser(description="YouTube → text pipeline")
    parser.add_argument("url", help="YouTube URL")
    parser.add_argument("--model", default="base",
                        choices=["tiny", "base", "small", "medium", "large"],
                        help="Whisper model size (default: base)")
    parser.add_argument("--output", help="Save transcript to file")
    args = parser.parse_args()

    text = transcribe(args.url, args.model)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"\nTranscript saved to: {args.output}")
    else:
        print("\n=== TRANSCRIPT ===")
        print(text)


if __name__ == "__main__":
    main()
