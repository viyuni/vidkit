export function parseTimeToSeconds(value: string): number {
  const input = value.trim();

  if (!input) {
    return Number.NaN;
  }

  if (/^\d+(\.\d+)?$/.test(input)) {
    return Number(input);
  }

  const parts = input.split(':');

  if (parts.length < 2 || parts.length > 3) {
    return Number.NaN;
  }

  const numbers = parts.map((part) => Number(part));

  if (numbers.some((number) => !Number.isFinite(number))) {
    return Number.NaN;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = numbers;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = numbers;
  return hours * 3600 + minutes * 60 + seconds;
}

export function parseTimeList(value: string): number[] {
  return value
    .split(',')
    .map((item) => parseTimeToSeconds(item))
    .filter((item) => Number.isFinite(item));
}

export function formatSecondsForFfmpeg(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error(`Invalid time value: ${seconds}`);
  }

  return seconds.toFixed(3).replace(/\.?0+$/, '');
}
