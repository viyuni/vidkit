import { mkdtemp, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { runCommand } from './command.ts';
import { formatSecondsForFfmpeg } from './time.ts';

export interface GenerateFrameSheetOptions {
  input: string;
  output: string;

  /**
   * 从指定时间开始，单位秒。
   */
  start?: number;

  /**
   * 每隔多少秒抽一帧。
   * 默认 5。
   */
  every?: number;

  /**
   * 指定时间点，单位秒。
   *
   * 如果 start 存在，这里的时间点表示相对 start 的偏移。
   * 例如 start=600, at=[0,10,20] 表示 600s、610s、620s。
   */
  at?: number[];

  /**
   * every 模式下最多抽多少帧。
   * 默认 10。
   */
  limit?: number;

  /**
   * 每张小图宽度。
   * 默认 320。
   */
  width?: number;

  /**
   * 拼图列数。
   * 默认 5。
   */
  columns?: number;

  /**
   * 是否使用精确 seek。
   * false 时 -ss 放在 -i 前，速度更快。
   * true 时 -ss 放在 -i 后，较慢但更精确。
   */
  accurate?: boolean;

  /**
   * ffmpeg 可执行文件路径。
   */
  ffmpegPath?: string;
}

interface NormalizedFrameSheetOptions {
  input: string;
  output: string;
  start: number;
  every: number;
  at?: number[];
  limit: number;
  width: number;
  columns: number;
  accurate: boolean;
  ffmpegPath: string;
}

export async function generateFrameSheet(options: GenerateFrameSheetOptions): Promise<void> {
  const normalized = normalizeFrameSheetOptions(options);
  validateFrameSheetOptions(normalized);

  const input = resolve(normalized.input);
  const output = resolve(normalized.output);

  if (!existsSync(input)) {
    throw new Error(`Input file does not exist: ${input}`);
  }

  await mkdir(dirname(output), { recursive: true });

  const tempDir = await mkdtemp(join(tmpdir(), 'vidkit-sheet-'));

  try {
    if (normalized.at?.length) {
      await extractFramesByTimes({
        ...normalized,
        input,
        tempDir,
      });
    } else {
      await extractFramesByInterval({
        ...normalized,
        input,
        tempDir,
      });
    }

    const frameCount = await countExtractedFrames(tempDir);

    if (frameCount === 0) {
      throw new Error('No frames were extracted from the input video.');
    }

    await stitchFrames({
      ffmpegPath: normalized.ffmpegPath,
      tempDir,
      output,
      columns: normalized.columns,
      frameCount,
    });
  } finally {
    await rm(tempDir, {
      recursive: true,
      force: true,
    });
  }
}

function normalizeFrameSheetOptions(
  options: GenerateFrameSheetOptions,
): NormalizedFrameSheetOptions {
  return {
    input: options.input,
    output: options.output,
    start: options.start ?? 0,
    every: options.every ?? 5,
    at: options.at?.length ? options.at : undefined,
    limit: options.limit ?? 10,
    width: options.width ?? 320,
    columns: options.columns ?? 5,
    accurate: options.accurate ?? false,
    ffmpegPath: options.ffmpegPath ?? 'ffmpeg',
  };
}

function validateFrameSheetOptions(options: NormalizedFrameSheetOptions): void {
  if (!options.input) {
    throw new Error('Input video is required.');
  }

  if (!options.output) {
    throw new Error('Output image path is required.');
  }

  if (!Number.isFinite(options.start) || options.start < 0) {
    throw new Error('--start must be greater than or equal to 0.');
  }

  if (!Number.isFinite(options.every) || options.every <= 0) {
    throw new Error('--every must be greater than 0.');
  }

  if (!Number.isInteger(options.limit) || options.limit <= 0) {
    throw new Error('--limit must be a positive integer.');
  }

  if (!Number.isInteger(options.width) || options.width <= 0) {
    throw new Error('--width must be a positive integer.');
  }

  if (!Number.isInteger(options.columns) || options.columns <= 0) {
    throw new Error('--cols must be a positive integer.');
  }

  if (options.at?.some((time) => !Number.isFinite(time) || time < 0)) {
    throw new Error('--at values must be greater than or equal to 0.');
  }
}

async function extractFramesByInterval(
  options: NormalizedFrameSheetOptions & {
    input: string;
    tempDir: string;
  },
): Promise<void> {
  const outputPattern = join(options.tempDir, 'frame-%06d.jpg');

  const args = ['-hide_banner', '-loglevel', 'warning'];

  if (options.start > 0 && !options.accurate) {
    args.push('-ss', formatSecondsForFfmpeg(options.start));
  }

  args.push('-i', options.input);

  if (options.start > 0 && options.accurate) {
    args.push('-ss', formatSecondsForFfmpeg(options.start));
  }

  args.push(
    '-vf',
    [`fps=1/${options.every}`, `scale=${options.width}:-1`].join(','),
    '-frames:v',
    String(options.limit),
    '-q:v',
    '2',
    '-y',
    outputPattern,
  );

  await runCommand(options.ffmpegPath, args);
}

async function extractFramesByTimes(
  options: NormalizedFrameSheetOptions & {
    input: string;
    tempDir: string;
  },
): Promise<void> {
  const times = options.at ?? [];

  for (let index = 0; index < times.length; index += 1) {
    const relativeTime = times[index];
    const absoluteTime = options.start + relativeTime;
    const output = join(options.tempDir, `frame-${String(index + 1).padStart(6, '0')}.jpg`);

    await extractSingleFrame({
      ffmpegPath: options.ffmpegPath,
      input: options.input,
      output,
      time: absoluteTime,
      width: options.width,
      accurate: options.accurate,
    });
  }
}

async function extractSingleFrame(options: {
  ffmpegPath: string;
  input: string;
  output: string;
  time: number;
  width: number;
  accurate: boolean;
}): Promise<void> {
  const args = ['-hide_banner', '-loglevel', 'warning'];

  if (!options.accurate) {
    args.push('-ss', formatSecondsForFfmpeg(options.time));
  }

  args.push('-i', options.input);

  if (options.accurate) {
    args.push('-ss', formatSecondsForFfmpeg(options.time));
  }

  args.push(
    '-frames:v',
    '1',
    '-vf',
    `scale=${options.width}:-1`,
    '-q:v',
    '2',
    '-y',
    options.output,
  );

  await runCommand(options.ffmpegPath, args);
}

async function stitchFrames(options: {
  ffmpegPath: string;
  tempDir: string;
  output: string;
  columns: number;
  frameCount: number;
}): Promise<void> {
  const rows = Math.ceil(options.frameCount / options.columns);
  const inputPattern = join(options.tempDir, 'frame-%06d.jpg');

  const args = [
    '-hide_banner',
    '-loglevel',
    'warning',
    '-framerate',
    '1',
    '-start_number',
    '1',
    '-i',
    inputPattern,
    '-vf',
    `tile=${options.columns}x${rows}:nb_frames=${options.frameCount}`,
    '-frames:v',
    '1',
    '-y',
    options.output,
  ];

  await runCommand(options.ffmpegPath, args);
}

async function countExtractedFrames(tempDir: string): Promise<number> {
  const files = await readdir(tempDir);

  return files.filter((file) => /^frame-\d{6}\.jpg$/.test(file)).length;
}
