import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header, Footer } from '@/widgets/app-shell';
import { cn } from '@/shared/lib/cn';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: '애견 이미지 프로세서',
  description: '애견 키워드 이미지 검색, 선별, 효과 다운로드를 한 화면에서 처리하는 작업 앱임.',
  keywords: ['애견 이미지', '강아지 이미지', '반려견 이미지', '이미지 다운로드', '이미지 프로세서'],
  authors: [{ name: '케인님' }],
  robots: 'index, follow',
  openGraph: {
    title: '애견 이미지 프로세서',
    description: '애견 키워드로 이미지를 모으고 효과 적용 다운로드까지 한 번에 처리함',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '애견 이미지 프로세서',
    description: '애견 키워드 검색과 다운로드 워크플로우를 한 번에 처리함',
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: '#10b981',
  width: 'device-width',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={cn('font-sans')}>
        <Providers>
          <Header />
          <main className={cn('min-h-screen py-12')}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
