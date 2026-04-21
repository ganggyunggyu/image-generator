import { NextResponse } from 'next/server';
import { createHarnessReport } from '@/shared/lib/harness';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  const report = await createHarnessReport();

  return NextResponse.json(report, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
};
