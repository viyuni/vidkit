import { command } from 'cleye';
import { resolve } from 'node:path';
import { loadEnvFile } from '../env-file.ts';
import { synthesizeSpeech, synthesizeSpeechFromJson } from './speech.ts';
import { getTTSEnv } from './env.ts';

export const ttsCommand = command(
  {
    name: 'tts',
    parameters: ['[text]'],
    flags: {
      envFile: {
        type: String,
        placeholder: '<path>',
        description: 'Load TTS environment variables from a file.',
      },
      output: {
        type: String,
        alias: 'o',
        description: 'Output audio path.',
      },
      provider: {
        type: String,
        description:
          'TTS provider. Supported: openai, minimax. Can also be configured by environment variable.',
      },
      model: {
        type: String,
        description: 'TTS model. Can also be configured by environment variable.',
      },
      voice: {
        type: String,
        description: 'TTS voice. Can also be configured by environment variable.',
      },
      apiKey: {
        type: String,
        description: 'API key. Can also be configured by environment variable.',
      },
      apiBaseUrl: {
        type: String,
        description: 'API base URL. Can also be configured by environment variable.',
      },
      json: {
        type: String,
        description:
          'Split render TTS from JSON file. Supports string[] or { name?: string; display?: string; tts: string }[].',
      },
    },
    help: {
      description: 'Generate speech audio from text.',
      examples: [
        'vidkit tts "hello" -o hello.mp3',
        'vidkit tts "hello" --provider openai --model tts-1 --voice alloy -o hello.mp3',
        'vidkit tts "hello" --provider minimax --model speech-02-hd --voice male-qn-qingse -o hello.mp3',
        'vidkit tts "hello" --model openai/tts-1 --voice alloy -o hello.mp3',
        'vidkit tts "hello" --model minimax/speech-02-hd --voice male-qn-qingse -o hello.mp3',
        'vidkit tts "hello" --api-key sk-xxx --api-base-url https://api.openai.com/v1',

        // JSON split rendering
        'vidkit tts --json ./script.json -o ./audios',
        'vidkit tts --json ./script.json --provider openai --model tts-1 --voice alloy -o ./audios',
        'vidkit tts --json ./script.json --provider minimax --model speech-02-hd --voice male-qn-qingse -o ./audios',
        'vidkit tts --json ./script.json --model openai/tts-1 --voice alloy -o ./audios',
        'vidkit tts --json ./script.json --model minimax/speech-02-hd --voice male-qn-qingse -o ./audios',
      ],
    },
  },
  async (argv) => {
    const { flags } = argv;

    if (flags.envFile) {
      loadEnvFile(resolve(flags.envFile));
    }

    const ttsEnv = getTTSEnv();

    const model = flags.model ?? ttsEnv.TTS_MODEL;
    const voice = flags.voice ?? ttsEnv.TTS_VOICE;
    const apiKey = flags.apiKey ?? ttsEnv.TTS_API_KEY;
    const apiBaseUrl = flags.apiBaseUrl ?? ttsEnv.TTS_API_BASE_URL;
    const provider = flags.provider ?? ttsEnv.TTS_PROVIDER;
    const outputPath = resolve(flags.output ?? 'speech.mp3');

    if (!model) {
      throw new Error('TTS model is required. Pass "--model" or set TTS_MODEL.');
    }

    if (flags.json) {
      const outputDir = resolve(flags.output ?? 'speech');

      const result = await synthesizeSpeechFromJson({
        jsonPath: flags.json,
        outputDir,
        provider,
        model,
        voice,
        apiKey,
        apiBaseUrl,
      });

      console.log(`Generated ${result.total} speech audio files.`);
      return;
    }

    const text = argv._.text;

    if (!text) {
      throw new Error('Text is required. Usage: vidkit tts "hello" -o hello.mp3');
    }

    await synthesizeSpeech({
      text,
      outputPath,
      provider,
      model,
      voice,
      apiKey,
      apiBaseUrl,
    });

    console.log(`Speech audio saved to ${outputPath}`);
  },
);
