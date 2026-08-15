// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title: { default: '秋日公园 — Autumn Park', template: '%s · 秋日公园' },
  description: '一座随四季流转的数字公园：照片、留言与天气都安静地留在这里。',
  openGraph: {
    title: '秋日公园 — Autumn Park',
    description: '一座随四季流转的数字公园。',
    type: 'website',
    locale: 'zh_CN',
    siteName: '秋日公园',
    ...(SITE_URL ? { url: SITE_URL } : {}),
  },
  twitter: { card: 'summary' },
  ...(SITE_URL ? { alternates: { canonical: SITE_URL } } : {}),
};

export const viewport: Viewport = {
  themeColor: '#f6f0e4',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased"><main className="contents">{children}</main></body>
    </html>
  );
}
