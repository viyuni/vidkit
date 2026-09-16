import type { TTSAdapterOptions } from './types.ts';

interface XiaomiTTSResponse {
  choices?: Array<{
    message?: {
      audio?: {
        data?: string;
      };
    };
  }>;
  error?: {
    message?: string;
  };
}

export function createXiaomiTTSRequest(options: TTSAdapterOptions) {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  if (options.instructions) {
    messages.push({
      role: 'user',
      content: options.instructions,
    });
  }

  messages.push({
    role: 'assistant',
    content: options.text,
  });

  return {
    model: options.model,
    messages,
    audio: {
      format: 'wav' as const,
      ...(options.voice ? { voice: options.voice } : {}),
    },
    stream: false,
  };
}

export async function synthesizeXiaomiSpeech(options: TTSAdapterOptions): Promise<Uint8Array> {
  if (!options.apiKey) {
    throw new Error(
      'Xiaomi MiMo TTS API key is required. Pass "--api-key" or set TTS_API_KEY.',
    );
  }

  const baseUrl = options.apiBaseUrl ?? 'https://api.xiaomimimo.com/v1';
  const url = new URL('chat/completions', ensureTrailingSlash(baseUrl));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createXiaomiTTSRequest(options)),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`Xiaomi MiMo TTS request failed with HTTP ${response.status}: ${rawBody}`);
  }

  let body: XiaomiTTSResponse;

  try {
    body = JSON.parse(rawBody) as XiaomiTTSResponse;
  } catch {
    throw new Error(`Xiaomi MiMo TTS returned invalid JSON: ${rawBody}`);
  }

  const audio = body.choices?.[0]?.message?.audio?.data;

  if (!audio) {
    throw new Error(
      `Xiaomi MiMo TTS returned empty audio${body.error?.message ? `: ${body.error.message}` : ''}`,
    );
  }

  return Uint8Array.from(Buffer.from(audio, 'base64'));
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}
