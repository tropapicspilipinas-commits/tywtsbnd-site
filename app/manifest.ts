// app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  const name = 'Things you wanted to say but never did';
  return {
    name,
    short_name: 'Unspoken Words',
    description: 'Share your unspoken words or write a note to Geloy.',
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#ffffff',
  };
}
