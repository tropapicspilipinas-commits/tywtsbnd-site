'use client';

import { useEffect, useMemo, useState } from 'react';

type Item = {
  id: string;
  content: string;
  type: 'message' | 'review';
  created_at: string;
  status?: string;
};

type PlacedItem = Item & {
  x: number;      // 0–100 (%)
  y: number;      // 0–100 (%)
  w: number;      // width in px
  r: number;      // rotation in deg
  z: number;      // z-index
  dur: number;    // animation duration (s)
  delay: number;  // animation delay (s)
};

export default function ReviewsWall() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

  async function fetchFeed() {
    setLoading(true);
    try {
      const res = await fetch('/api/feed?type=review', { cache: 'no-store' });
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFeed();
  }, []);

  const canvasHeight = useMemo(() => {
    if (typeof window === 'undefined') return 1200;
    const base = Math.max(900, window.innerHeight);
    const extra = Math.min(2400, Math.max(0, (items.length - 8) * 120));
    return base + extra;
  }, [items.length, shuffleKey]);

  const placed = useMemo<PlacedItem[]>(() => {
    const isNarrow = typeof window !== 'undefined' && window.innerWidth < 640;
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    return items.map((it) => {
      const width = isNarrow ? rand(180, 260) : rand(220, 340);
      const x = rand(6, 92);
      const y = rand(4, 96);
      const r = rand(-2.5, 2.5);
      const dur = rand(6, 10);
      const delay = rand(0, 5);
      const z = Math.floor(rand(1, 5));
      return { ...it, x, y, w: width, r, dur, delay, z };
    });
  }, [items, shuffleKey]);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Public Wall · Letters to Geloy</h1>
            <nav className="mt-1 text-sm text-neutral-600">
              <a className="underline hover:no-underline" href="/">Home</a>
              <span className="mx-2">•</span>
              <a className="underline hover:no-underline" href="/wall/messages">Unspoken words</a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShuffleKey((k) => k + 1)}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-neutral-100"
              title="Shuffle the layout"
            >
              Shuffle layout
            </button>
            <a
              href="/wall/reviews"
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-neutral-100"
              title="Refresh posts"
            >
              Refresh posts
            </a>
          </div>
        </header>

        {loading && <p className="text-neutral-600">Loading…</p>}

        {(!loading && items.length === 0) ? (
          <p className="text-neutral-600">No approved posts yet for this wall.</p>
        ) : (
          <div key={shuffleKey} className="relative w-full" style={{ height: canvasHeight }}>
            {placed.map((it) => (
              <article
                key={it.id}
                className="absolute select-none p-3 sm:p-4 rounded-2xl border border-neutral-200 bg-white/95 shadow-lg shadow-black/5 backdrop-blur
                           transition-transform hover:scale-[1.02] hover:shadow-xl"
                style={{
                  left: `${it.x}%`,
                  top: `${it.y}%`,
                  width: it.w,
                  zIndex: it.z,
                  // @ts-ignore CSS vars for animation
                  '--r': `${it.r}deg`,
                  '--dur': `${it.dur}s`,
                  '--delay': `${it.delay}s`,
                  animation: 'drift var(--dur) ease-in-out infinite',
                  animationDelay: 'var(--delay)',
                } as React.CSSProperties}
              >
                <div className="whitespace-pre-wrap text-[13.5px] leading-relaxed sm:text-sm">
                  {it.content}
                </div>
                <div className="mt-2 text-[10px] text-neutral-500">
                  {new Date(it.created_at).toLocaleString()}
                </div>
              </article>
            ))}

            <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-neutral-400">
              Scroll to see more • Click “Shuffle layout” to rearrange
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes drift {
          0%   { transform: translateY(0px) rotate(var(--r)); }
          50%  { transform: translateY(-6px) rotate(var(--r)); }
          100% { transform: translateY(0px) rotate(var(--r)); }
        }
      `}</style>
    </main>
  );
}
