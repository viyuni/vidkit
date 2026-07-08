import { spawn } from 'node:child_process';

export interface RunCommandOptions {
  cwd?: string;
  stdio?: 'inherit' | 'pipe';
}

export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<void> {
  const { cwd, stdio = 'pipe' } = options;

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio,
      windowsHide: true,
    });

    let stderr = '';

    if (stdio === 'pipe') {
      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on('error', reject);

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const detail = stderr.trim();
      reject(
        new Error(
          detail
            ? `${command} exited with code ${code}\n${detail}`
            : `${command} exited with code ${code}`,
        ),
      );
    });
  });
}
