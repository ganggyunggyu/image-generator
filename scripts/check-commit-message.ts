import { readFileSync } from 'fs';
import { validateCommitMessage } from './lib/commit-message';

const main = (): void => {
  const messageFilePath = process.argv[2];

  if (!messageFilePath) {
    process.stderr.write('commit message 파일 경로가 필요함\n');
    process.exit(1);
  }

  const message = readFileSync(messageFilePath, 'utf8');
  const validation = validateCommitMessage(message);

  if (validation.isValid) {
    return;
  }

  process.stderr.write('커밋 메시지에 아래 줄이 모두 필요함\n');
  validation.errors.forEach((error) => {
    process.stderr.write(`- ${error}\n`);
  });
  process.stderr.write('\n예시\n');
  process.stderr.write('Expected: 이번 작업에서 기대한 결과\n');
  process.stderr.write('Verification: 원하는 결과를 어떻게 직접 확인했는지\n');
  process.stderr.write('Tests: 실행한 테스트 명령\n');
  process.exit(1);
};

main();
