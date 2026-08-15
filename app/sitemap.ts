// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  return [
    { url: `${base}/park`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/wall`, changeFrequency: 'daily', priority: 0.6 },
  ];
}
