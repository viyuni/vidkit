import type { TTSAdapterOptions } from './types.ts';

interface MiniMaxT2AResponse {
  data?: {
    audio?: string;
    status?: number;
  } | null;
  trace_id?: string;
  base_resp?: {
    status_code?: number;
    status_msg?: string;
  };
}

export async function synthesizeMiniMaxSpeech(options: TTSAdapterOptions): Promise<Uint8Array> {
  if (!options.apiKey) {
    throw new Error('MiniMax TTS API key is required. Pass "--api-key" or set TTS_API_KEY.');
  }

  const baseUrl = options.apiBaseUrl ?? 'https://api.minimaxi.com/v1';
  const url = new URL('t2a_v2', ensureTrailingSlash(baseUrl));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      text: options.text,
      stream: false,
      voice_setting: {
        voice_id: options.voice ?? 'male-qn-qingse',
        speed: options.speed ?? 1,
        vol: options.volume ?? 1,
        pitch: options.pitch ?? 0,
        ...(options.emotion ? { emotion: options.emotion } : {}),
      },
      audio_setting: {
        sample_rate: options.sampleRate ?? 32000,
        bitrate: options.bitrate ?? 128000,
        format: options.audioFormat ?? 'mp3',
        channel: options.channel ?? 1,
      },
      output_format: options.outputFormat ?? 'hex',
      subtitle_enable: false,
    }),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`MiniMax TTS request failed with HTTP ${response.status}: ${rawBody}`);
  }

  let body: MiniMaxT2AResponse;

  try {
    body = JSON.parse(rawBody) as MiniMaxT2AResponse;
  } catch {
    throw new Error(`MiniMax TTS returned invalid JSON: ${rawBody}`);
  }

  const statusCode = body.base_resp?.status_code ?? 0;

  if (statusCode !== 0) {
    throw new Error(
      `MiniMax TTS failed: ${body.base_resp?.status_msg ?? 'Unknown error'}${body.trace_id ? `, trace_id: ${body.trace_id}` : ''}`,
    );
  }

  const audio = body.data?.audio;

  if (!audio) {
    throw new Error(
      `MiniMax TTS returned empty audio${body.trace_id ? `, trace_id: ${body.trace_id}` : ''}`,
    );
  }

  return hexToUint8Array(audio);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('MiniMax TTS returned invalid hex audio.');
  }

  return Uint8Array.from(Buffer.from(hex, 'hex'));
}
