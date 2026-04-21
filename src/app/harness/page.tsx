import type { Metadata } from 'next';
import { createHarnessReport } from '@/shared/lib/harness';
import { HarnessDashboard } from '@/widgets/harness-dashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Harness Dashboard | Image Gallery',
  description: '환경변수, 파일 시스템, API surface, 검증 루프를 한 번에 확인하는 사람용 하네스 대시보드입니다.',
};

const Page = async () => {
  const report = await createHarnessReport();

  return <HarnessDashboard report={report} />;
};

export default Page;
