import { describe, expect, it } from 'vite-plus/test';
import { TTSProviders } from '../tts/providers/index.ts';
import { createXiaomiTTSRequest } from '../tts/providers/xiaomi.ts';
import { parseTTSJsonInput } from '../tts/speech.ts';

describe('TTS providers', () => {
  it('registers Xiaomi MiMo', () => {
    expect(TTSProviders).toContain('xiaomi');
  });
});

describe('Xiaomi MiMo TTS', () => {
  it('maps instructions to the user message and text to the assistant message', () => {
    expect(
      createXiaomiTTSRequest({
        model: 'mimo-v2.5-tts',
        text: '老板，我跟你说个好消息！',
        voice: '冰糖',
        instructions: '非常开心，语速稍快。',
      }),
    ).toEqual({
      model: 'mimo-v2.5-tts',
      messages: [
        { role: 'user', content: '非常开心，语速稍快。' },
        { role: 'assistant', content: '老板，我跟你说个好消息！' },
      ],
      audio: {
        format: 'wav',
        voice: '冰糖',
      },
      stream: false,
    });
  });

  it('omits the optional user message when instructions are not provided', () => {
    expect(
      createXiaomiTTSRequest({
        model: 'mimo-v2.5-tts',
        text: '你好。',
      }),
    ).toEqual({
      model: 'mimo-v2.5-tts',
      messages: [{ role: 'assistant', content: '你好。' }],
      audio: {
        format: 'wav',
        voice: 'mimo_default',
      },
      stream: false,
    });
  });
});

describe('Batch TTS', () => {
  it('parses per-item instructions', () => {
    expect(
      parseTTSJsonInput([
        'First narration line.',
        {
          name: 'happy.wav',
          display: 'Happy',
          tts: '好消息！',
          instructions: '开心、轻快。',
        },
      ]),
    ).toEqual([
      {
        name: 'speech-001.mp3',
        text: 'First narration line.',
      },
      {
        name: 'happy.wav',
        text: '好消息！',
        display: 'Happy',
        instructions: '开心、轻快。',
      },
    ]);
  });
});
