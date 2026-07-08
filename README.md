# Vidkit

AI video helper CLI for text-to-speech audio generation and video frame sheet previews.

## Install

Install Vidkit in a project:

```bash
pnpm add -D @viyuni/vidkit
```

Or run it directly:

```bash
pnpm exec vidkit --help
npx vidkit --help
```

## Text To Speech

Generate one audio file:

```bash
pnpm exec vidkit tts "hello" -o hello.mp3
```

Choose a provider, model, and voice:

```bash
pnpm exec vidkit tts "hello" --provider openai --model tts-1 --voice alloy -o hello.mp3
pnpm exec vidkit tts "hello" --provider minimax --model speech-02-hd --voice male-qn-qingse -o hello.mp3
```

You can also use the `provider/model` shorthand:

```bash
pnpm exec vidkit tts "hello" --model openai/tts-1 --voice alloy -o hello.mp3
pnpm exec vidkit tts "hello" --model minimax/speech-02-hd --voice male-qn-qingse -o hello.mp3
```

Configuration can come from flags or environment variables:

```bash
TTS_PROVIDER=openai
TTS_MODEL=tts-1
TTS_VOICE=alloy
TTS_API_KEY=sk-...
TTS_API_BASE_URL=https://api.openai.com/v1
```

## Batch TTS

Render multiple audio files from JSON:

```bash
pnpm exec vidkit tts --json ./script.json -o ./audios
```

Supported JSON input:

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

String items are written as `speech-001.mp3`, `speech-002.mp3`, and so on. Object items require `tts`; `name` controls the output file name.

## Frame Sheets

Vidkit uses `ffmpeg` to extract and stitch video frames. Make sure `ffmpeg` is installed and available on `PATH`, or pass `--ffmpeg`.

Generate a preview sheet:

```bash
pnpm exec vidkit sheet input.mp4 -o preview.jpg
```

Capture interval frames:

```bash
pnpm exec vidkit sheet input.mp4 --start 00:01:30 --every 5 --limit 12 --cols 4 --width 320 -o preview.jpg
```

Capture exact timestamps:

```bash
pnpm exec vidkit sheet input.mp4 --start 00:10:00 --at 0,10,20 -o preview.jpg
```

Use `--accurate` for slower but more precise seeking.

## Codex Skill

This repository also ships a Codex skill for adding Vidkit workflows to other projects:

```text
skills/vidkit
```

Install it with a skill installer that supports GitHub paths:

```bash
npx skills add https://github.com/viyuni/vidkit/tree/main/skills/vidkit
```

If your installer uses owner/repo path syntax:

```bash
npx skills add github:viyuni/vidkit/skills/vidkit
```

Manual fallback:

```text
target-project/
  .codex/
    skills/
      vidkit/
        SKILL.md
        agents/
          openai.yaml
```

Then ask Codex in the target project:

```text
Use $vidkit to add TTS and frame-sheet workflows to this project.
```

## Development

Install dependencies:

```bash
vp install
```

Run checks and tests:

```bash
vp check
vp test
```

Build the package:

```bash
vp pack
```
