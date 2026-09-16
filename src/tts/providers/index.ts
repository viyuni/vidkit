import { synthesizeMiniMaxSpeech } from './minimax.ts';
import { synthesizeOpenAISpeech } from './openai.ts';
import { synthesizeXiaomiSpeech } from './xiaomi.ts';

export const ttsProviders = {
  openai: synthesizeOpenAISpeech,
  minimax: synthesizeMiniMaxSpeech,
  xiaomi: synthesizeXiaomiSpeech,
} as const;

export type TTSProvider = keyof typeof ttsProviders;

export const TTSProviders = Object.keys(ttsProviders) as TTSProvider[];

export function isTTSProvider(value: string): value is TTSProvider {
  return value in ttsProviders;
}

export function resolveTTSSynthesizer(provider?: string) {
  if (!provider || !isTTSProvider(provider)) {
    return ttsProviders.openai;
  }

  return ttsProviders[provider];
}
