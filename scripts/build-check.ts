import { spawnSync } from 'child_process';
import { collectBuildWarnings } from './lib/build-log';

const main = (): void => {
  const result = spawnSync('pnpm', ['build'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const combinedOutput = `${stdout}\n${stderr}`;

  process.stdout.write(stdout);
  process.stderr.write(stderr);

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const warnings = collectBuildWarnings(combinedOutput);

  if (warnings.length === 0) {
    process.stdout.write('\n[build:check] build warning 없음\n');
    return;
  }

  process.stderr.write('\n[build:check] build warning 탐지됨\n');
  warnings.forEach((warning) => {
    process.stderr.write(`- ${warning}\n`);
  });
  process.exit(1);
};

main();
