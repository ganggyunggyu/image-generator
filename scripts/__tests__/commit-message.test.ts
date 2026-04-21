import { describe, expect, it } from 'vitest';
import { validateCommitMessage } from '../lib/commit-message';

describe('validateCommitMessage', () => {
  it('기대결과, 검증, 테스트 줄이 모두 있으면 통과함', () => {
    const result = validateCommitMessage(`
하네스 자동 검증 게이트 추가

Expected: pre-commit 과 CI 에서 동일한 검증 게이트가 실행됨
Verification: pnpm verify:task 와 pnpm build 로 로컬 동작 확인함
Tests: pnpm test:run
`);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('주석 라인은 무시하고 필요한 줄이 없으면 실패함', () => {
    const result = validateCommitMessage(`
# Please enter the commit message
하네스 규칙 문서 업데이트

Expected: 작업 체크리스트가 문서에 반영됨
Tests: pnpm test:run
`);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Verification'),
      ])
    );
  });

  it('merge 나 fixup 커밋은 자동 통과시킴', () => {
    expect(validateCommitMessage('Merge branch main').isValid).toBe(true);
    expect(validateCommitMessage('fixup! 하네스 카드 정리').isValid).toBe(true);
  });
});
