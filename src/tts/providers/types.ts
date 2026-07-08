export interface TTSAdapterOptions {
  apiKey?: string;
  apiBaseUrl?: string;
  model: string;
  text: string;
  voice?: string;

  outputFormat?: 'hex' | 'url';
  audioFormat?: 'mp3' | 'wav' | 'flac';
  sampleRate?: number;
  bitrate?: number;
  channel?: number;
  speed?: number;
  volume?: number;
  pitch?: number;
  emotion?: string;
}

export type TTSAdapter = (options: TTSAdapterOptions) => Promise<Uint8Array>;
