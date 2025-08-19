'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Item = {
  id: string;
  content: string;
  type: 'message' | 'review' | 'bright';
  created_at: string;
  status?: string;
};

type Deco = {
  rot: number;
  jitterX: number;
  dur: number;
  delay: number;
  twinkleDur: number;
  twinkleDelay: number;
};

export default function BrightWall() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/feed?type=bright', { cache: 'no-store' });
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const Background = () => (
    <>
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: 'url(/bg/night-sky-film.jpg)' }}
      />
      <div className="fixed inset-0 -z-10 bg-black/60" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_55%,rgba(0,0,0,0.35)_80%,rgba(0,0,0,0.6)_100%)]" />
    </>
  );

  const layout = useMemo(() => {
    const W = containerRef.current?.clientWidth ?? 960;
    let cols = 4;
    let gap = 28;
    if (W < 640) { cols = 2; gap = 18; }
    else if (W < 1024) { cols = 3; gap = 22; }
    const colW = Math.floor((W - gap * (cols - 1)) / cols);
    const rowUnit = 8;
    return { cols, gap, colW, rowUnit };
  }, [containerRef.current?.clientWidth, shuffleKey]);

  const estimateHeight = (text: string, width: number) => {
    const charsPerLine = Math.max(18, Math.floor(width / 7));
    const lines = Math.max(2, Math.ceil(text.length / charsPerLine));
    const lineH = 22;
    const timeLine = 16;
    const minH = 52;
    const maxH = 560;
    return Math.min(maxH, Math.max(minH, lines * lineH + timeLine));
  };

  const deco = useMemo<Record<string, Deco>>(() => {
    const rnd = () => Math.random();
    const out: Record<string, Deco> = {};
    for (const it of items) {
      out[it.id] = {
        rot: (rnd() * 2.4 - 1.2),
        jitterX: Math.round(rnd() * 12 - 6),
        dur: 7 + rnd() * 5,
        delay: rnd() * 6,
        twinkleDur: 3.5 + rnd() * 3.5,
        twinkleDelay: rnd() * 5,
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
    <main className="min-h-screen text-white">
      <Background />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold drop-shadow-[0_0_14px_rgba(255,255,255,0.35)]">
              Public Wall · Brighten up someone’s day
            </h1>
            <nav className="mt-1 text-sm text-white/80">
              <a className="underline decoration-white/50 underline-offset-4 hover:decoration-white" href="/">Home</a>
              <span className="mx-2">•</span>
              <a className="underline decoration-white/50 underline-offset-4 hover:decoration-white" href="/wall/messages">Unspoken words</a>
              <span className="mx-2">•</span>
              <a className="underline decoration-white/50 underline-offset-4 hover:decoration-white" href="/wall/reviews">Letters to Geloy</a>
              <span className="mx-2">•</span>
              <a className="underline decoration-white/80 underline-offset-4" href="/wall/bright">Brighten up someone’s day</a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShuffleKey((k) => k + 1)}
              className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm shadow-sm hover:bg-white/15 backdrop-blur"
              title="Shuffle layout"
            >
              Shuffle layout
            </button>
            <a
              href="/wall/bright"
              className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm shadow-sm hover:bg-white/15 backdrop-blur"
              title="Refresh posts"
            >
              Refresh posts
            </a>
          </div>
        </header>

        {loading && <p className="text-white/80">Loading…</p>}

        {(!loading && items.length === 0) ? (
          <p className="text-white/80">No approved posts yet for this wall.</p>
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
                  className="relative will-change-transform"
                  style={{
                    gridRowEnd: `span ${s.span}`,
                    transform: `translateX(${d.jitterX}px) rotate(${d.rot}deg)`,
                  }}
                >
                  <div
                    className="floaty twinkle select-text"
                    style={{
                      animationDuration: `${d.dur}s, ${d.twinkleDur}s`,
                      animationDelay: `${d.delay}s, ${d.twinkleDelay}s`,
                    }}
                  >
                    <div
                      className="whitespace-pre-wrap text-[14px] leading-relaxed sm:text-[15px]"
                      style={{
                        textShadow:
                          '0 0 6px rgba(255,255,255,0.85), 0 0 12px rgba(255,255,255,0.55), 0 0 24px rgba(180,220,255,0.35)',
                      }}
                    >
                      {it.content}
                    </div>
                    <div className="mt-1 text-[10px] text-white/70"
                         style={{ textShadow: '0 0 8px rgba(255,255,255,0.45)' }}>
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
        .floaty { animation-name: bob; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        .twinkle { animation-name: bob, twinkle; animation-timing-function: ease-in-out, linear; animation-iteration-count: infinite, infinite; }
        @keyframes bob { 0%{transform:translateY(0px);} 50%{transform:translateY(-8px);} 100%{transform:translateY(0px);} }
        @keyframes twinkle {
          0%{opacity:.92;filter:drop-shadow(0 0 2px rgba(255,255,255,.5));}
          25%{opacity:1;filter:drop-shadow(0 0 4px rgba(255,255,255,.6));}
          50%{opacity:.88;filter:drop-shadow(0 0 6px rgba(200,220,255,.55));}
          75%{opacity:1;filter:drop-shadow(0 0 4px rgba(255,255,255,.6));}
          100%{opacity:.92;filter:drop-shadow(0 0 2px rgba(255,255,255,.5));}
        }
      `}</style>
    </main>
  );
}
