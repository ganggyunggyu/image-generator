import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Google Image to PNG - 이미지 검색 & PNG 변환 서비스',
  description: 'Google 이미지 검색 결과를 PNG 형식으로 변환하여 다운로드할 수 있는 무료 서비스입니다.',
  keywords: ['이미지 검색', 'PNG 변환', 'Google 이미지', '이미지 다운로드', '무료 도구'],
  authors: [{ name: '케인님' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Google Image to PNG - 이미지 검색 & PNG 변환',
    description: 'Google 이미지 검색 결과를 PNG로 변환하여 다운로드하세요',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Google Image to PNG',
    description: 'Google 이미지 검색 결과를 PNG로 변환하여 다운로드하세요',
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
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.className}>
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="bg-gray-800 text-white py-8">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-sm text-gray-300 mb-2">
              © 2024 Google Image to PNG Service. Made with ❤️ by 케인님
            </p>
            <p className="text-xs text-gray-400">
              이 서비스는 Google Programmable Search API를 사용하며,
              모든 이미지의 저작권은 원본 소유자에게 있습니다.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}