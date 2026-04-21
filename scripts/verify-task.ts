import { spawnSync } from 'child_process';

type TaskCommand = {
  args: string[];
  label: string;
};

const TASK_COMMANDS: TaskCommand[] = [
  {
    args: ['harness:check', '--summary'],
    label: 'Harness 상태 확인',
  },
  {
    args: ['test:run'],
    label: '전체 테스트 실행',
  },
  {
    args: ['lint'],
    label: '린트 검증',
  },
  {
    args: ['build:check'],
    label: '빌드 경고 검증',
  },
];

const runPnpmCommand = ({ args, label }: TaskCommand): void => {
  process.stdout.write(`\n[verify:task] ${label}\n`);

  const result = spawnSync('pnpm', args, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const printGitStatusReminder = (): void => {
  process.stdout.write('\n[verify:task] 변경 범위 확인\n');

  const result = spawnSync('git', ['status', '--short'], {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const printCommitReminder = (): void => {
  process.stdout.write(
    '\n[verify:task] 커밋 메시지에는 Expected, Verification, Tests 줄이 필요함\n'
  );
};

const main = (): void => {
  TASK_COMMANDS.forEach(runPnpmCommand);
  printGitStatusReminder();
  printCommitReminder();
};

main();
