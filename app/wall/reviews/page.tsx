'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Item = {
  id: string;
  content: string;
  type: 'message' | 'review';
  created_at: string;
  status?: string;
};

type Deco = {
  rot: number;
  jitterX: number;
  dur: number;
  delay: number;
};

export default function ReviewsWall() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
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

  const layout = useMemo(() => {
    const W = containerRef.current?.clientWidth ?? 960;
    let cols = 4;
    let gap = 24;
    if (W < 640) { cols = 2; gap = 16; }
    else if (W < 1024) { cols = 3; gap = 20; }
    const colW = Math.floor((W - gap * (cols - 1)) / cols);
    const rowUnit = 8;
    return { W, cols, gap, colW, rowUnit };
  }, [containerRef.current?.clientWidth, shuffleKey]);

  const estimateHeight = (text: string, width: number) => {
    const charsPerLine = Math.max(18, Math.floor(width / 7));
    const lines = Math.max(2, Math.ceil(text.length / charsPerLine));
    const lineH = 20;
    const padding = 14 + 14;
    const timeLine = 16;
    const minH = 64;
    const maxH = 520;
    return Math.min(maxH, Math.max(minH, lines * lineH + padding + timeLine));
  };

  const deco = useMemo<Record<string, Deco>>(() => {
    const rng = () => Math.random();
    const out: Record<string, Deco> = {};
    for (const it of items) {
      out[it.id] = {
        rot: (rng() * 3 - 1.5),
        jitterX: Math.round(rng() * 10 - 5),
        dur: 6 + rng() * 4,
        delay: rng() * 5,
      };
    }
    return out;
  }, [items, shuffleKey]);

  const spans = useMemo(() => {
    return items.map((it) => {
      const h = estimateHeight(it.content, layout.colW);
      const span = Math.ceil(h / layout.rowUnit);
      return { id: it.id, span, estH: h };
    });
  }, [items, layout.colW, layout.rowUnit]);

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
          <div
            ref={containerRef}
            key={shuffleKey}
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
              gridAutoRows: `${layout.rowUnit}px`,
              gap: `${layout.gap}px`,
            }}
          >
            {items.map((it) => {
              const s = spans.find((x) => x.id === it.id)!;
              const d = deco[it.id];
              return (
                <article
                  key={it.id}
                  className="relative"
                  style={{
                    gridRowEnd: `span ${s.span}`,
                    transform: `translateX(${d.jitterX}px) rotate(${d.rot}deg)`,
                  }}
                >
                  <div
                    className="floaty"
                    style={{ animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
                  >
                    <div className="whitespace-pre-wrap text-[13.5px] leading-relaxed sm:text-sm"
                         style={{ textShadow: '0 0 1px rgba(0,0,0,0.08)' }}>
                      {it.content}
                    </div>
                    <div className="mt-1 text-[10px] text-neutral-500">
                      {new Date(it.created_at).toLocaleString()}
                    </div>
                  </div>
                </article>
              );
            })}
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
