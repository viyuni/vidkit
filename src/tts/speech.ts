import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { resolveTTSSynthesizer } from './providers/index.ts';

export interface SynthesizeSpeechOptions {
  text: string;
  outputPath: string;
  model: string;
  voice?: string;
  instructions?: string;
  language?: string;
  apiKey?: string;
  apiBaseUrl?: string;
  provider?: string;
}

export type TTSJsonItem =
  | string
  | {
      name?: string;
      display?: string;
      tts: string;
    };

export interface TTSJsonJob {
  name: string;
  text: string;
  display?: string;
}

export interface SynthesizeSpeechFromJsonOptions extends Omit<
  SynthesizeSpeechOptions,
  'text' | 'outputPath'
> {
  jsonPath: string;
  outputDir: string;
}

export interface SynthesizeSpeechFromJsonResult {
  total: number;
  outputs: string[];
}

export async function synthesizeSpeech(options: SynthesizeSpeechOptions) {
  const speech = resolveTTSSynthesizer(options.provider);

  const result = await speech(options);

  const outputPath = resolve(options.outputPath);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, result);
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function ensureAudioExt(value: string) {
  return extname(value) ? value : `${value}.mp3`;
}

function createIndexedName(index: number) {
  return `speech-${String(index + 1).padStart(3, '0')}.mp3`;
}

export function parseTTSJsonInput(value: unknown): TTSJsonJob[] {
  if (!Array.isArray(value)) {
    throw new Error('TTS JSON must be an array.');
  }

  return value.map((item, index) => {
    if (typeof item === 'string') {
      const text = item.trim();

      if (!text) {
        throw new Error(`TTS JSON item ${index + 1} is empty.`);
      }

      return {
        name: createIndexedName(index),
        text,
      };
    }

    if (typeof item === 'object' && item !== null) {
      const objectItem = item as {
        name?: unknown;
        display?: unknown;
        tts?: unknown;
      };

      if (typeof objectItem.tts !== 'string' || !objectItem.tts.trim()) {
        throw new Error(`TTS JSON item ${index + 1} requires "tts".`);
      }

      const name =
        typeof objectItem.name === 'string' && objectItem.name.trim()
          ? objectItem.name.trim()
          : undefined;

      const display =
        typeof objectItem.display === 'string' && objectItem.display.trim()
          ? objectItem.display.trim()
          : undefined;

      const rawName = name ?? display;

      return {
        name: rawName ? ensureAudioExt(sanitizeFileName(rawName)) : createIndexedName(index),
        text: objectItem.tts.trim(),
        display,
      };
    }

    throw new Error(`Invalid TTS JSON item at index ${index}.`);
  });
}

export async function readTTSJsonJobs(jsonPath: string) {
  const outputPath = resolve(jsonPath);
  const content = await readFile(outputPath, 'utf8');

  try {
    return parseTTSJsonInput(JSON.parse(content));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid TTS JSON file: ${outputPath}`);
    }

    throw error;
  }
}

export async function synthesizeSpeechFromJson(
  options: SynthesizeSpeechFromJsonOptions,
): Promise<SynthesizeSpeechFromJsonResult> {
  const { jsonPath, outputDir, ...speechOptions } = options;

  const jobs = await readTTSJsonJobs(jsonPath);
  const resolvedOutputDir = resolve(outputDir);
  const outputs: string[] = [];

  await mkdir(resolvedOutputDir, { recursive: true });

  for (const [index, job] of jobs.entries()) {
    const outputPath = resolve(resolvedOutputDir, job.name);

    console.log(`[${index + 1}/${jobs.length}] Rendering ${job.display ?? basename(outputPath)}`);

    await synthesizeSpeech({
      ...speechOptions,
      text: job.text,
      outputPath,
    });

    outputs.push(outputPath);
  }

  return {
    total: jobs.length,
    outputs,
  };
}
