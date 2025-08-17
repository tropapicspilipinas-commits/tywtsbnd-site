// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Things you wanted to say but never did',
  title: {
    default: 'Things you wanted to say but never did',
    template: '%s · Things you wanted to say but never did',
  },
  description: 'Share your unspoken words or write a note to Geloy.',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Things you wanted to say but never did',
    title: 'Things you wanted to say but never did',
    description: 'Share your unspoken words or write a note to Geloy.',
  },
  appleWebApp: {
    capable: true,
    title: 'Things you wanted to say but never did',
    statusBarStyle: 'default',
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
