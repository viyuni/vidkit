---
name: vidkit
description: Install and use the Vidkit AI video helper CLI in another project. Use when a project needs `@viyuni/vidkit` / `vidkit` for text-to-speech audio generation, batch TTS from JSON scripts, or video frame sheet preview images with ffmpeg.
---

# Vidkit

## Default Approach

- Treat Vidkit as a CLI-first tool. Do not assume a stable JavaScript import API unless the installed package exports one.
- Install the package into the target project when repeated use is expected:
  - `pnpm add -D @viyuni/vidkit`
  - `npm install -D @viyuni/vidkit`
  - `yarn add -D @viyuni/vidkit`
- Use the project package runner for one-off commands:
  - `pnpm exec vidkit ...`
  - `npx vidkit ...`
  - `yarn vidkit ...`

## TTS

- Generate a single audio file:

```bash
vidkit tts "hello" -o hello.mp3
```

- Select provider/model/voice explicitly:

```bash
vidkit tts "hello" --provider openai --model tts-1 --voice alloy -o hello.mp3
vidkit tts "hello" --provider minimax --model speech-02-hd --voice male-qn-qingse -o hello.mp3
```

- The `--model provider/model` shorthand is also supported:

```bash
vidkit tts "hello" --model openai/tts-1 --voice alloy -o hello.mp3
vidkit tts "hello" --model minimax/speech-02-hd --voice male-qn-qingse -o hello.mp3
```

- Prefer environment variables for credentials:
  - `TTS_PROVIDER`: `openai` or `minimax`
  - `TTS_MODEL`: provider model name, optionally `provider/model`
  - `TTS_VOICE`: provider voice name
  - `TTS_API_KEY`: provider API key
  - `TTS_API_BASE_URL`: optional compatible API base URL
- Load TTS variables from an env file when needed:

```bash
vidkit tts "hello" -o hello.mp3 --env-file .env
vidkit tts --json ./script.json -o ./audios --env-file ./config/tts.env
```

- Treat `--env-file` as a `tts`-only option. Resolve relative paths from the current working directory.
- Existing process environment variables take precedence over values loaded from the env file.
- Never write real API keys into committed files. Use `.env.local`, CI secrets, or the host platform's secret store.

## Batch TTS From JSON

- Use `--json` to render many audio files into a directory:

```bash
vidkit tts --json ./script.json -o ./audios
```

- Supported JSON formats:

```json
[
  "First narration line.",
  {
    "name": "intro.mp3",
    "display": "Intro",
    "tts": "Second narration line."
  }
]
```

- If an item is a string, Vidkit names it `speech-001.mp3`, `speech-002.mp3`, and so on.
- If an item is an object, `tts` is required. `name` controls the output file name; without `name`, Vidkit uses `display` when present.

## Frame Sheets

- Vidkit uses `ffmpeg` for frame extraction. Ensure `ffmpeg` is installed and available on `PATH`, or pass `--ffmpeg`.
- Generate a basic preview sheet:

```bash
vidkit sheet input.mp4 -o preview.jpg
```

- Capture interval frames:

```bash
vidkit sheet input.mp4 --start 00:01:30 --every 5 --limit 12 --cols 4 --width 320 -o preview.jpg
```

- Capture specific timestamps. When `--start` is present, `--at` values are offsets from that start time:

```bash
vidkit sheet input.mp4 --start 00:10:00 --at 0,10,20 -o preview.jpg
```

- Use `--accurate` when precision matters more than speed.

## Integration Guidance

- In automation scripts, write generated audio and preview sheets into a project-owned output directory such as `assets/generated`, `public/generated`, or `tmp/vidkit`.
- Add generated media to `.gitignore` unless the project intentionally checks in rendered assets.
- Validate integration by running at least one real `vidkit tts` or `vidkit sheet` command with safe sample inputs.
- When a command fails, first check missing credentials, model/voice mismatch, missing `ffmpeg`, and output directory permissions.
