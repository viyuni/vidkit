import { command } from 'cleye';
import { generateFrameSheet } from './frame-sheet.ts';
import { parseTimeList, parseTimeToSeconds } from './time.ts';

export const sheetCommand = command(
  {
    name: 'sheet',
    parameters: ['<input>'],
    flags: {
      output: {
        type: String,
        alias: 'o',
        default: 'preview.jpg',
        description: 'Output image path.',
      },
      start: {
        type: String,
        description: 'Start time. Supports 30, 3.5, 01:20, 00:01:20.',
      },
      every: {
        type: Number,
        description: 'Capture one frame every N seconds. Default: 5.',
      },
      at: {
        type: String,
        description: 'Comma-separated timestamps, e.g. 1,3.5,00:01:20.',
      },
      limit: {
        type: Number,
        default: 10,
        description: 'Maximum frames in interval mode.',
      },
      cols: {
        type: Number,
        default: 5,
        description: 'Number of columns.',
      },
      width: {
        type: Number,
        default: 320,
        description: 'Width of each frame.',
      },
      accurate: {
        type: Boolean,
        default: false,
        description: 'Use accurate seek. Slower but more precise.',
      },
      ffmpeg: {
        type: String,
        default: 'ffmpeg',
        description: 'Path to ffmpeg executable.',
      },
    },
    help: {
      description: 'Generate a frame sheet from a video.',
      examples: [
        'vidkit sheet input.mp4',
        'vidkit sheet input.mp4 -o preview.jpg',
        'vidkit sheet input.mp4 --start 00:01:30 --every 5',
        'vidkit sheet input.mp4 --start 00:10:00 --at 0,10,20',
        'vidkit sheet input.mp4 --every 3 --limit 12 --cols 4 --width 320',
      ],
    },
  },
  async (argv) => {
    const start = argv.flags.start ? parseTimeToSeconds(argv.flags.start) : undefined;

    const at = argv.flags.at ? parseTimeList(argv.flags.at) : undefined;

    await generateFrameSheet({
      input: argv._.input,
      output: argv.flags.output,
      start,
      every: argv.flags.every,
      at,
      limit: argv.flags.limit,
      columns: argv.flags.cols,
      width: argv.flags.width,
      accurate: argv.flags.accurate,
      ffmpegPath: argv.flags.ffmpeg,
    });
  },
);
