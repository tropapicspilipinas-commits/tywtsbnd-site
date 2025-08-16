'use client';

import { useState } from 'react';

export default function Home() {
  const [msg, setMsg] = useState('');
  const [rev, setRev] = useState('');
  const [loading, setLoading] = useState(false);

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

      alert('Sent. Thank you. Your submission is pending approval.');
    } catch {
      alert('Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const msgPct = Math.min(100, Math.round((msg.length / 2000) * 100));
  const revPct = Math.min(100, Math.round((rev.length / 2000) * 100));

  return (
    <main className="min-h-screen text-neutral-900 bg-neutral-50 [background:radial-gradient(1200px_600px_at_50%_-10%,rgba(0,0,0,0.06),transparent)]">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Things you wanted to say but never did
          </h1>
          <nav className="mt-3 text-sm text-neutral-700">
            <a className="inline-flex items-center rounded-full border border-neutral-300 bg-white/80 px-4 py-1.5 shadow-sm hover:bg-white transition"
               href="/wall/messages">
              See Unspoken Words Wall
            </a>
            <span className="mx-2 text-neutral-400">•</span>
            <a className="inline-flex items-center rounded-full border border-neutral-300 bg-white/80 px-4 py-1.5 shadow-sm hover:bg-white transition"
               href="/wall/reviews">
              See Letters Wall
            </a>
          </nav>
        </header>

        {/* Message box */}
        <section className="mt-4 rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur shadow-lg shadow-black/5 p-6">
          <h2 className="text-lg font-medium">Share your unspoken words</h2>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="What’s something you wanted to say but never did?"
            rows={5}
            className="mt-3 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 outline-none ring-0 transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
            spellCheck={false}
          />
          <div className="mt-2 flex items-center justify-between text-sm text-neutral-600">
            <span>{msg.length}/2000</span>
            <button
              onClick={() => submit('message')}
              disabled={loading}
              className="inline-flex items-center rounded-full bg-black px-5 py-2 text-white shadow-sm disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Submit anonymously'}
            </button>
          </div>
          {/* progress */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200">
            <div
              className="h-1.5 rounded-full bg-neutral-900 transition-all"
              style={{ width: `${msgPct}%` }}
            />
          </div>
        </section>

        {/* Letter box */}
        <section className="mt-6 rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur shadow-lg shadow-black/5 p-6">
          <h2 className="text-lg font-medium">A note to Geloy</h2>
          <textarea
            value={rev}
            onChange={(e) => setRev(e.target.value)}
            placeholder="How does this project affect you? Anything you want to say to Geloy. And if you can, tell him where you are writing from!"
            rows={5}
            className="mt-3 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 outline-none ring-0 transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
            spellCheck={false}
          />
          <div className="mt-2 flex items-center justify-between text-sm text-neutral-600">
            <span>{rev.length}/2000</span>
            <button
              onClick={() => submit('review')}
              disabled={loading}
              className="inline-flex items-center rounded-full bg-black px-5 py-2 text-white shadow-sm disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send letter'}
            </button>
          </div>
          {/* progress */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200">
            <div
              className="h-1.5 rounded-full bg-neutral-900 transition-all"
              style={{ width: `${revPct}%` }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
