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
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Public Wall · Unspoken Words</h1>
          <nav className="mt-2 text-sm text-neutral-600">
            <a className="underline hover:no-underline" href="/">Home</a>
            <span className="mx-2">•</span>
            <a className="underline hover:no-underline" href="/wall/reviews">Go to Letters Wall</a>
          </nav>
        </header>

        {loading ? (
          <p className="text-neutral-600">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-neutral-600">No approved posts yet for this wall.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {items.map((it) => (
              <li key={it.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="whitespace-pre-wrap leading-relaxed">{it.content}</div>
                <div className="mt-2 text-xs text-neutral-500">
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
