'use client';

import { useEffect, useState } from 'react';

type Item = {
  id: string;
  content: string;
  type: 'message' | 'review';
  created_at: string;
  status?: string;
};

export default function MessagesWall() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchFeed() {
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
  }

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <main className="min-h-screen text-neutral-900 bg-neutral-50 [background:radial-gradient(1200px_600px_at_50%_-10%,rgba(0,0,0,0.06),transparent)]">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Public Wall · Unspoken Words</h1>
          <nav className="mt-3 text-sm text-neutral-700">
            <a className="inline-flex items-center rounded-full border border-neutral-300 bg-white/80 px-4 py-1.5 shadow-sm hover:bg-white transition"
               href="/">Home</a>
            <span className="mx-2 text-neutral-400">•</span>
            <a className="inline-flex items-center rounded-full border border-neutral-300 bg-white/80 px-4 py-1.5 shadow-sm hover:bg-white transition"
               href="/wall/reviews">Go to Letters Wall</a>
          </nav>
        </header>

        {loading ? (
          <p className="text-neutral-600">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-neutral-600">No approved posts yet for this wall.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {items.map((it) => (
              <li
                key={it.id}
                className="rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur p-5 shadow-lg shadow-black/5"
              >
                <div className="whitespace-pre-wrap leading-relaxed">{it.content}</div>
                <div className="mt-3 text-xs text-neutral-500">
                  {new Date(it.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
