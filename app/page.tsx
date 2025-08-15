'use client';
import { useEffect, useState } from 'react';

type FeedRow = { id: string; type: 'message' | 'review'; content: string; created_at: string };

export default function Page() {
  // 1) “Things you wanted to say…”
  const [msg, setMsg] = useState('');
  const [loading1, setLoading1] = useState(false);

  // 2) “Letter to Geloy”
  const [rev, setRev] = useState('');
  const [loading2, setLoading2] = useState(false);

  // 3) Public wall
  const [filter, setFilter] = useState<'all'|'message'|'review'>('all');
  const [feed, setFeed] = useState<FeedRow[]>([]);

  useEffect(() => { fetchFeed(); }, [filter]);

  async function fetchFeed() {
    const q = filter === 'all' ? '' : `?type=${filter}`;
    const res = await fetch(`/api/feed${q}`);
    const data = await res.json();
    setFeed(data.items || []);
  }

  async function submit(kind: 'message'|'review') {
    const text = (kind === 'message' ? msg : rev).trim();
    if (!text) return alert('Write something first.');
    try {
      kind === 'message' ? setLoading1(true) : setLoading2(true);
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: kind, text }),
      });
      if (!res.ok) throw new Error('submit failed');
      if (kind === 'message') setMsg(''); else setRev('');
      await fetchFeed();
      alert('Sent. Thank you.');
    } catch {
      alert('Submission failed. Try again.');
    } finally {
      kind === 'message' ? setLoading1(false) : setLoading2(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-neutral-200">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white font-semibold">T</span>
            <div className="leading-tight">
              <h1 className="text-lg font-bold">Things you wanted to say but never did</h1>
              <p className="text-xs text-neutral-500">Share a whisper. Keep it anonymous.</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <a className="hover:underline" href="#share">Share</a>
            <a className="hover:underline" href="#letter">Letter to Geloy</a>
            <a className="hover:underline" href="#wall">Wall</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 space-y-12">
        {/* 1) Prompt */}
        <section id="share" className="grid md:grid-cols-2 gap-8 items-start">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-xl font-semibold mb-2">Things you wanted to say but never did</h2>
            <textarea
              value={msg}
              onChange={e=>setMsg(e.target.value)}
              placeholder="Write it here..."
              className="w-full h-48 rounded-xl border border-neutral-300 p-3 outline-none focus:ring-2 focus:ring-neutral-800"
              maxLength={2000}
            />
            <div className="text-xs text-neutral-500 text-right mt-1">{msg.length}/2000</div>
            <button
              onClick={()=>submit('message')}
              disabled={loading1}
              className="w-full rounded-xl bg-neutral-900 text-white py-3 font-semibold disabled:opacity-60 mt-4"
            >
              {loading1? 'Submitting...' : 'Submit anonymously'}
            </button>
          </div>
        </section>

        {/* 2) Letter */}
        <section id="letter" className="grid md:grid-cols-2 gap-8 items-start">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-xl font-semibold mb-2">Write a letter to Geloy</h2>
            <textarea
              value={rev}
              onChange={e=>setRev(e.target.value)}
              placeholder="Write it here..."
              className="w-full h-48 rounded-xl border border-neutral-300 p-3 outline-none focus:ring-2 focus:ring-neutral-800"
              maxLength={2000}
            />
            <div className="text-xs text-neutral-500 text-right mt-1">{rev.length}/2000</div>
            <button
              onClick={()=>submit('review')}
              disabled={loading2}
              className="w-full rounded-xl bg-neutral-900 text-white py-3 font-semibold disabled:opacity-60 mt-4"
            >
              {loading2? 'Submitting...' : 'Send letter'}
            </button>
          </div>
        </section>

        {/* 3) Public wall */}
        <section id="wall" className="p-6 bg-white rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Public wall</h2>
            <select
              value={filter}
              onChange={e=>setFilter(e.target.value as any)}
              className="border border-neutral-300 rounded-lg px-2 py-1 text-sm"
            >
              <option value="all">all</option>
              <option value="message">prompts</option>
              <option value="review">letters</option>
            </select>
          </div>
          <div className="space-y-3 max-h-[70vh] overflow-auto pr-2">
            {feed.map((f) => (
              <article key={f.id} className="p-4 border border-neutral-200 rounded-xl">
                <div className="text-xs text-neutral-500 mb-1">{new Date(f.created_at).toLocaleString()}</div>
                <div className="inline-flex items-center gap-2 text-xs text-neutral-600 mb-2">
                  <span className="px-2 py-0.5 border rounded-full">{f.type}</span>
                </div>
                <p className="whitespace-pre-wrap text-neutral-800">{f.content}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-4 py-10 text-xs text-neutral-500">
        © {new Date().getFullYear()} Things you wanted to say but never did
      </footer>
    </div>
  );
}
