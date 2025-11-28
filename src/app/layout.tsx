import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from './_components/Header';
import { Footer } from './_components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Image Gallery - 프리미엄 이미지 검색 & WebP 변환',
  description: 'Google 이미지 검색 결과를 WebP 형식으로 변환하여 다운로드할 수 있는 프리미엄 서비스입니다.',
  keywords: ['이미지 검색', 'WebP 변환', 'Google 이미지', '이미지 다운로드', '프리미엄 갤러리'],
  authors: [{ name: '케인님' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Image Gallery - 프리미엄 이미지 검색 & WebP 변환',
    description: 'Google 이미지 검색 결과를 WebP로 변환하여 다운로드하세요',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Image Gallery',
    description: 'Google 이미지 검색 결과를 WebP로 변환하여 다운로드하세요',
  },
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
        <meta name="theme-color" content="#10b981" />
      </head>
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen py-12">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}