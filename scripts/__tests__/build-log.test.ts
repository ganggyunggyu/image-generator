import { describe, expect, it } from 'vitest';
import { collectBuildWarnings, hasBuildWarnings } from '../lib/build-log';

describe('build-log', () => {
  it('Next build 출력에서 경고 줄을 추출함', () => {
    const warnings = collectBuildWarnings(`
⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
some detail
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
Detected multiple Jotai instances. It may cause unexpected behavior with the default store.
`);

    expect(warnings).toEqual([
      '⚠ Warning: Next.js inferred your workspace root, but it may not be correct.',
      '⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.',
      'Detected multiple Jotai instances. It may cause unexpected behavior with the default store.',
    ]);
  });

  it('경고가 없으면 false 를 반환함', () => {
    expect(hasBuildWarnings('Compiled successfully')).toBe(false);
  });

  it('같은 경고는 한 번만 반환함', () => {
    const warnings = collectBuildWarnings(`
⚠ Unsupported metadata viewport is configured in metadata export in /.
⚠ Unsupported metadata viewport is configured in metadata export in /.
`);

    expect(warnings).toEqual([
      '⚠ Unsupported metadata viewport is configured in metadata export in /.',
    ]);
  });
});
