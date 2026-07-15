import arkenv from 'arkenv';
import { type } from 'arktype';
import { TTSProviders } from './providers/index.ts';

export function getTTSEnv() {
  return arkenv(
    {
      TTS_API_BASE_URL: 'string?',
      TTS_API_KEY: 'string?',
      TTS_MODEL: 'string?',
      TTS_VOICE: 'string?',
      TTS_PROVIDER: type.enumerated(...TTSProviders).optional(),
    },
    {
      emptyAsUndefined: true,
    },
  );
}
