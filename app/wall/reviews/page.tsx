'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Item = {
  id: string;
  content: string;
  type: 'message' | 'review';
  created_at: string;
  status?: string;
};

type Placed = {
  id: string;
  content: string;
  created_at: string;
  x: number; y: number; w: number; h: number; r: number; z: number; dur: number; delay: number;
};

export default function ReviewsWall() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [canvasH, setCanvasH] = useState(1200);
  const [shuffleKey, setShuffleKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const estimateHeight = (text: string, width: number) => {
    const CPL = Math.max(16, Math.floor(width / 7));
    const lines = Math.max(2, Math.ceil(text.length / CPL));
    const lineH = 20;
    const padding = 24 + 16;
    const minH = 90;
    const maxH = 460;
    return Math.min(maxH, Math.max(minH, lines * lineH + padding));
  };

  const chooseWidth = (isNarrow: boolean) => {
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    return isNarrow ? rand(190, 270) : rand(230, 360);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth || 900;
    const isNarrow = containerW < 640;

    const withSize = items.map((it) => {
      const w = chooseWidth(isNarrow);
      const h = estimateHeight(it.content, w);
      return { it, w, h };
    });

    const totalArea = withSize.reduce((s, x) => s + x.w * x.h, 0);
    const base = Math.max(900, typeof window !== 'undefined' ? window.innerHeight : 900);
    const needed = Math.ceil(totalArea / containerW * 1.25);
    const height = Math.max(base, Math.min(32000, needed));
    setCanvasH(height);

    const placedOut: Placed[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const intersects = (a: Placed, b: Placed) =>
      !(
        a.x + a.w <= b.x ||
        b.x + b.w <= a.x ||
        a.y + a.h <= b.y ||
        b.y + b.h <= a.y
      );

    for (const row of withSize) {
      const rDeg = rand(-2.5, 2.5);
      const z = Math.floor(rand(1, 5));
      const dur = rand(6, 10);
      const delay = rand(0, 5);

      let placedOne: Placed | null = null;
      const maxTries = 300;
      for (let t = 0; t < maxTries; t++) {
        const margin = 8;
        const x = Math.floor(rand(margin, Math.max(margin, containerW - row.w - margin)));
        const y = Math.floor(rand(margin, Math.max(margin, height - row.h - margin)));
        const cand: Placed = {
          id: row.it.id, content: row.it.content, created_at: row.it.created_at,
          x, y, w: row.w, h: row.h, r: rDeg, z, dur, delay,
        };
        if (!placedOut.some((p) => intersects(cand, p))) {
          placedOne = cand;
          break;
        }
      }
      if (!placedOne) {
        const y = placedOut.reduce((acc, p) => Math.max(acc, p.y + p.h + 12), 8);
        placedOne = {
          id: row.it.id, content: row.it.content, created_at: row.it.created_at,
          x: 8, y: Math.min(y, height - row.h - 8), w: row.w, h: row.h, r: 0, z: 1, dur, delay,
        };
      }
      placedOut.push(placedOne);
    }

    setPlaced(placedOut);
  }, [items, shuffleKey]);

  useEffect(() => {
    const onResize = () => setShuffleKey((k) => k + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
          <div ref={containerRef} key={shuffleKey} className="relative w-full" style={{ height: canvasH }}>
            {placed.map((p) => (
              <article
                key={p.id}
                className="absolute select-none rounded-2xl border border-neutral-200 bg-white/95 shadow-lg shadow-black/5 backdrop-blur transition-transform hover:scale-[1.02] hover:shadow-xl"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.w,
                  height: p.h,
                  zIndex: p.z,
                  transform: `rotate(${p.r}deg)`,
                }}
              >
                <div
                  className="h-full p-3 sm:p-4 floaty"
                  style={{ animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
                >
                  <div className="whitespace-pre-wrap text-[13.5px] leading-relaxed sm:text-sm">
                    {p.content}
                  </div>
                  <div className="mt-2 text-[10px] text-neutral-500">
                    {new Date(p.created_at).toLocaleString()}
                  </div>
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
        .floaty {
          animation-name: bob;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes bob {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </main>
  );
}
