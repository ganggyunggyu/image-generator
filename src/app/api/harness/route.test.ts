import { describe, expect, it, vi } from 'vitest';

const { createHarnessReport } = vi.hoisted(() => ({
  createHarnessReport: vi.fn(),
}));

vi.mock('@/shared/lib/harness', () => ({
  createHarnessReport,
}));

import { GET } from './route';

describe('GET /api/harness', () => {
  it('하네스 진단 JSON 을 no-store 로 반환함', async () => {
    createHarnessReport.mockResolvedValue({
      generatedAt: '2026-04-09T00:00:00.000Z',
      status: 'ready',
      verification: {
        recommendedCommands: ['pnpm harness:check'],
        warnings: [],
      },
    });

    const response = await GET();
    const body = (await response.json()) as {
      status: string;
      verification: { recommendedCommands: string[] };
    };

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body.status).toBe('ready');
    expect(body.verification.recommendedCommands).toContain('pnpm harness:check');
  });
});
