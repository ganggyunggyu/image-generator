import { chmodSync, existsSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const HOOK_FILES = ['.githooks/pre-commit', '.githooks/commit-msg'] as const;

const ensureExecutableHooks = (cwd: string): void => {
  HOOK_FILES.forEach((hookFile) => {
    const absolutePath = path.join(cwd, hookFile);

    if (existsSync(absolutePath)) {
      chmodSync(absolutePath, 0o755);
    }
  });
};

const runGitConfig = (args: string[]): void => {
  const result = spawnSync('git', args, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const main = (): void => {
  const cwd = process.cwd();
  const gitDirectory = path.join(cwd, '.git');

  if (!existsSync(gitDirectory)) {
    process.stdout.write('[hooks:install] .git 디렉토리가 없어서 설치를 건너뜀\n');
    return;
  }

  ensureExecutableHooks(cwd);
  runGitConfig(['config', '--local', 'core.hooksPath', '.githooks']);
  runGitConfig(['config', '--local', 'commit.template', '.gitmessage']);

  process.stdout.write(
    '[hooks:install] core.hooksPath=.githooks, commit.template=.gitmessage 로 설정 완료\n'
  );
};

main();
