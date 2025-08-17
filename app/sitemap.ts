// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://YOURDOMAIN.com';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/wall/messages`, lastModified: now },
    { url: `${base}/wall/reviews`, lastModified: now },
  ];
}
