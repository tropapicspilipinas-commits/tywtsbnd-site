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

export default function MessagesWall() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [canvasH, setCanvasH] = useState(1200);
  const [shuffleKey, setShuffleKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ---- Fetch approved messages
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/feed?type=message', { cache: 'no-store' });
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- Helpers
  const rand = (a: number, b: number) => a + Math.random() * (b - a);

  const estimateHeight = (text: string, width: number) => {
    // Approx: avg char ~7px width at our font size; add padding + timestamp line
    const CPL = Math.max(16, Math.floor(width / 7));
    const lines = Math.max(2, Math.ceil(text.length / CPL));
    const lineH = 20;
    const padding = 24 + 16;
    const minH = 96;
    const maxH = 460;
    return Math.min(maxH, Math.max(minH, lines * lineH + padding));
  };

  const chooseWidth = (isNarrow: boolean) => (isNarrow ? rand(180, 240) : rand(220, 340));

  // Poisson-disc sampling (Bridson) for evenly spaced anchor points
  function poissonDisc(width: number, height: number, r: number, k = 30) {
    const cell = r / Math.SQRT2;
    const gridW = Math.ceil(width / cell);
    const gridH = Math.ceil(height / cell);
    const grid: (null | [number, number])[] = Array(gridW * gridH).fill(null);
    const points: [number, number][] = [];
    const active: [number, number][] = [];

    const gx = (x: number) => Math.floor(x / cell);
    const gy = (y: number) => Math.floor(y / cell);
    const gi = (x: number, y: number) => gy(y) * gridW + gx(x);

    function farEnough(x: number, y: number) {
      const gxi = gx(x);
      const gyi = gy(y);
      for (let yy = Math.max(gyi - 2, 0); yy <= Math.min(gyi + 2, gridH - 1); yy++) {
        for (let xx = Math.max(gxi - 2, 0); xx <= Math.min(gxi + 2, gridW - 1); xx++) {
          const p = grid[yy * gridW + xx];
          if (!p) continue;
          const dx = p[0] - x;
          const dy = p[1] - y;
          if (dx * dx + dy * dy < r * r) return false;
        }
      }
      return true;
    }

    // seed
    const seed: [number, number] = [Math.random() * width, Math.random() * height];
    points.push(seed);
    active.push(seed);
    grid[gi(seed[0], seed[1])] = seed;

    while (active.length) {
      const idx = Math.floor(Math.random() * active.length);
      const origin = active[idx];
      let found = false;

      for (let i = 0; i < k; i++) {
        const angle = Math.random() * Math.PI * 2;
        const m = r * (1 + Math.random()); // between r and 2r
        const nx = origin[0] + Math.cos(angle) * m;
        const ny = origin[1] + Math.sin(angle) * m;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height && farEnough(nx, ny)) {
          const p: [number, number] = [nx, ny];
          points.push(p);
          active.push(p);
          grid[gi(nx, ny)] = p;
          found = true;
          break;
        }
      }

      if (!found) {
        active.splice(idx, 1);
      }
    }

    return points;
  }

  // ---- Compute sizes, height, anchors, and collision-free placement
  useEffect(() => {
    if (!containerRef.current) return;

    const W = containerRef.current.clientWidth || 900;
    const isNarrow = W < 640;

    // Precompute widths/heights
    const sized = items.map((it) => {
      const w = chooseWidth(isNarrow);
      const h = estimateHeight(it.content, w);
      return { it, w, h };
    });

    // Choose canvas height from area (with slack)
    const totalArea = sized.reduce((s, x) => s + x.w * x.h, 0);
    const baseH = Math.max(900, typeof window !== 'undefined' ? window.innerHeight : 900);
    const neededH = Math.ceil(totalArea / W * 1.35); // a bit more slack for even spacing
    const H = Math.max(baseH, Math.min(48000, neededH));
    setCanvasH(H);

    // Pick Poisson radius based on average note size (smaller -> denser)
    const avgW = sized.reduce((s, x) => s + x.w, 0) / Math.max(1, sized.length || 1);
    const avgH = sized.reduce((s, x) => s + x.h, 0) / Math.max(1, sized.length || 1);
    const r = Math.max(40, Math.min(avgW, avgH) * 0.8);

    // Generate anchors; if too few, gently reduce r and retry once
    let anchors = poissonDisc(W, H, r);
    if (anchors.length < sized.length) anchors = poissonDisc(W, H, Math.max(28, r * 0.85));

    // Shuffle anchors for randomness
    anchors.sort(() => Math.random() - 0.5);

    // Collision check
    const intersects = (a: Placed, b: Placed) =>
      !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);

    const margin = 8;
    const out: Placed[] = [];

    for (const row of sized) {
      // Try anchors first
      let placedOne: Placed | null = null;

      for (let i = 0; i < anchors.length; i++) {
        const [cx, cy] = anchors[i];
        // center rect on the anchor, but clamp to bounds
        const x = Math.max(margin, Math.min(W - row.w - margin, Math.round(cx - row.w / 2)));
        const y = Math.max(margin, Math.min(H - row.h - margin, Math.round(cy - row.h / 2)));

        const candidate: Placed = {
          id: row.it.id,
          content: row.it.content,
          created_at: row.it.created_at,
          x, y, w: row.w, h: row.h,
          r: rand(-2.5, 2.5),
          z: Math.floor(rand(1, 5)),
          dur: rand(6, 10),
          delay: rand(0, 5),
        };

        if (!out.some((p) => intersects(candidate, p))) {
          placedOne = candidate;
          anchors.splice(i, 1); // consume this anchor
          // also remove anchors too close to avoid crowding
          anchors = anchors.filter(([ax, ay]) => {
            const dx = ax - (x + row.w / 2);
            const dy = ay - (y + row.h / 2);
            return dx * dx + dy * dy > (r * 0.75) * (r * 0.75);
          });
          break;
        }
      }

      // Fallback: random tries
      if (!placedOne) {
        const maxTries = 500;
        for (let t = 0; t < maxTries && !placedOne; t++) {
          const x = Math.floor(rand(margin, Math.max(margin, W - row.w - margin)));
          const y = Math.floor(rand(margin, Math.max(margin, H - row.h - margin)));
          const cand: Placed = {
            id: row.it.id, content: row.it.content, created_at: row.it.created_at,
            x, y, w: row.w, h: row.h, r: rand(-2, 2), z: 1, dur: rand(6, 10), delay: rand(0, 5),
          };
          if (!out.some((p) => intersects(cand, p))) placedOne = cand;
        }
      }

      // Last fallback: stacked
      if (!placedOne) {
        const y = out.reduce((acc, p) => Math.max(acc, p.y + p.h + 12), margin);
        placedOne = {
          id: row.it.id, content: row.it.content, created_at: row.it.created_at,
          x: margin, y: Math.min(y, H - row.h - margin), w: row.w, h: row.h, r: 0, z: 1,
          dur: rand(6, 10), delay: rand(0, 5),
        };
      }

      out.push(placedOne);
    }

    setPlaced(out);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, shuffleKey]);

  // Re-layout on resize
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
            <h1 className="text-2xl font-semibold">Public Wall · Unspoken Words</h1>
            <nav className="mt-1 text-sm text-neutral-600">
              <a className="underline hover:no-underline" href="/">Home</a>
              <span className="mx-2">•</span>
              <a className="underline hover:no-underline" href="/wall/reviews">Letters to Geloy</a>
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
              href="/wall/messages"
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
