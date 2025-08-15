'use client';

import { useEffect, useState } from 'react';

type Item = {
  id: string;
  content: string;
  type: 'message' | 'review';
  created_at: string;
  status?: string;
};

export default function Home() {
  const [msg, setMsg] = useState('');
  const [rev, setRev] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchFeed(type?: 'message' | 'review') {
    const qs = type ? `?type=${type}` : '';
    const res = await fetch(`/api/feed${qs}`, { cache: 'no-store' });
    const data = await res.json();
    setItems(Array.isArray(data.items) ? data.items : []);
  }

  useEffect(() => {
    fetchFeed();
  }, []);

  async function submit(kind: 'message' | 'review') {
    const text = (kind === 'message' ? msg : rev).trim();
    if (!text) {
      alert('Please write something first.');
      return;
    }
    if (text.length > 2000) {
      alert('Max 2000 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: kind, text }),
      });
      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        alert(data?.error || 'Submission failed');
        return;
      }

      if (kind === 'message') setMsg('');
      else setRev('');

      // ✅ keep this on one line (or use backticks + \n)
      alert('Sent. Thank you. Your submission is pending approval.');

      // Feed only shows approved items, but refresh anyway
      fetchFeed();
    } catch {
      alert('Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Things you wanted to say but never did</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Send your words</h2>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Things you wanted to say but never did…"
          rows={4}
          style={{ width: '100%', padding: 12 }}
        />
        <button onClick={() => submit('message')} disabled={loading} style={{ marginTop: 8 }}>
          Submit anonymously
        </button>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Send a letter to Geloy</h2>
        <textarea
          value={rev}
          onChange={(e) => setRev(e.target.value)}
          placeholder="Write your letter to Geloy…"
          rows={4}
          style={{ width: '100%', padding: 12 }}
        />
        <button onClick={() => submit('review')} disabled={loading} style={{ marginTop: 8 }}>
          Send letter
        </button>
      </section>

      <section style={{ marginTop: 48 }}>
        <h2>Public Wall</h2>
        {items.length === 0 ? (
          <p>No approved posts yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
            {items.map((it) => (
              <li key={it.id} style={{ padding: '12px 0', borderBottom: '1px solid #e5e5e5' }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{it.content}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                  {it.type} • {new Date(it.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
