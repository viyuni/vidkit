import { config } from 'dotenv';

export function loadEnvFile(path: string): void {
  const result = config({ path, quiet: true });

  if (result.error) {
    throw result.error;
  }
}
