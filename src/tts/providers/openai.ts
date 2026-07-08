import { generateSpeech } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { TTSAdapterOptions } from './types.ts';

export async function synthesizeOpenAISpeech(options: TTSAdapterOptions): Promise<Uint8Array> {
  const openai = createOpenAI({
    apiKey: options.apiKey,
    baseURL: options.apiBaseUrl,
  });

  const result = await generateSpeech({
    model: openai.speech(options.model),
    text: options.text,
    voice: options.voice,
  });

  return result.audio.uint8Array;
}
