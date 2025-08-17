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

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Things you wanted to say but never did</h1>
          <nav className="mt-2 text-sm text-neutral-600">
            <a className="underline hover:no-underline" href="/wall/messages">Unspoken words</a>
            <span className="mx-2">•</span>
            <a className="underline hover:no-underline" href="/wall/reviews">Letters to Geloy</a>
          </nav>
        </header>

        {/* Message box */}
        <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium">Share your unspoken words</h2>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="What’s something you wanted to say but never did?"
            rows={4}
            className="mt-3 w-full resize-vertical rounded-xl border border-neutral-300 bg-white p-3 outline-none ring-0 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900"
            spellCheck={false}
            maxLength={2000}
          />
          <div className="mt-2 flex items-center justify-between text-sm text-neutral-500">
            <span>{msg.length}/2000</span>
            <button
              onClick={() => submit('message')}
              disabled={loading}
              className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
            >
              Submit anonymously
            </button>
          </div>
        </section>

        {/* Letter box */}
        <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium">A note to Geloy</h2>
          <textarea
            value={rev}
            onChange={(e) => setRev(e.target.value)}
            placeholder="How does this project affect you? Anything you want to say to Geloy. And if you can, tell him where you are writing from!"
            rows={4}
            className="mt-3 w-full resize-vertical rounded-xl border border-neutral-300 bg-white p-3 outline-none ring-0 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900"
            spellCheck={false}
            maxLength={2000}
          />
          <div className="mt-2 flex items-center justify-between text-sm text-neutral-500">
            <span>{rev.length}/2000</span>
            <button
              onClick={() => submit('review')}
              disabled={loading}
              className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
            >
              Send letter
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
