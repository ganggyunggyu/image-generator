import { describe, expect, it } from 'vitest';
import { buildKeywordAccountMappingContent } from '../lib/keyword-account-map';

describe('buildKeywordAccountMappingContent', () => {
  it('계정별 키워드 매칭 텍스트를 생성함', () => {
    expect(
      buildKeywordAccountMappingContent([
        {
          accountId: 'weed3122',
          keywords: ['1688 도매방법', '1688도매사입'],
        },
        {
          accountId: 'mad1651',
          keywords: ['해외소싱'],
        },
      ]),
    ).toBe([
      'weed3122',
      '1688 도매방법',
      '1688도매사입',
      '',
      'mad1651',
      '해외소싱',
      '',
      '',
    ].join('\n'));
  });
});
