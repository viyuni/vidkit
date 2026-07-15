#!/usr/bin/env node

import { cli } from 'cleye';
import packageJson from '../package.json' with { type: 'json' };
import { sheetCommand } from './sheet/index.ts';
import { ttsCommand } from './tts/index.ts';

await cli({
  name: 'vidkit',
  version: packageJson.version,
  commands: [sheetCommand, ttsCommand],
  help: {
    description: 'AI video helper CLI.',
    examples: [
      'vidkit sheet input.mp4',
      'vidkit tts "hello" -o hello.mp3',
      'vidkit tts "hello" -o hello.mp3 --env-file=.env',
    ],
  },
});
