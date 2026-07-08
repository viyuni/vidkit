import { cli } from 'cleye';
import { sheetCommand } from './sheet/index.ts';
import { ttsCommand } from './tts/index.ts';

await cli({
  name: 'vidkit',
  version: '0.0.0',
  commands: [sheetCommand, ttsCommand],
  help: {
    description: 'AI video helper CLI.',
    examples: ['vidkit sheet input.mp4', 'vidkit tts "hello" -o hello.mp3'],
  },
});
