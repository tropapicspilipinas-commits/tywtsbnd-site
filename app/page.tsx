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

  const Background = () => (
    <>
      {/* film night-sky photo (use the same image as the walls, or swap the path) */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: 'url(/bg/night-sky-film.jpg)' }}
      />
      {/* darken + subtle vignette so white text glows nicely */}
      <div className="fixed inset-0 -z-10 bg-black/60" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_55%,rgba(0,0,0,0.35)_80%,rgba(0,0,0,0.6)_100%)]" />
    </>
  );

  return (
    <main className="min-h-screen text-white">
      <Background />

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header to match walls */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold drop-shadow-[0_0_14px_rgba(255,255,255,0.35)]">
            Things you wanted to say but never did
          </h1>
          <nav className="mt-1 text-sm text-white/80">
            <a className="underline decoration-white/50 underline-offset-4 hover:decoration-white" href="/wall/messages">
              Unspoken words
            </a>
            <span className="mx-2">•</span>
            <a className="underline decoration-white/50 underline-offset-4 hover:decoration-white" href="/wall/reviews">
              Letters to Geloy
            </a>
          </nav>
        </header>

        {/* Unspoken words input */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Share your unspoken words
          </h2>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="What’s something you wanted to say but never did?"
            rows={5}
            className="w-full rounded-2xl border border-white/30 bg-white/10 p-4 text-white placeholder-white/60 outline-none backdrop-blur
                       focus:border-white focus:ring-2 focus:ring-white/40"
            spellCheck={false}
            maxLength={2000}
          />
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>{msg.length}/2000</span>
            <button
              onClick={() => submit('message')}
              disabled={loading}
              className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-white shadow-sm backdrop-blur
                         hover:bg-white/15 disabled:opacity-60"
            >
              Submit anonymously
            </button>
          </div>
        </section>

        {/* Letters input */}
        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-medium drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            A note to Geloy
          </h2>
          <textarea
            value={rev}
            onChange={(e) => setRev(e.target.value)}
            placeholder="How does this project affect you? Anything you want to say to Geloy. And if you can, tell him where you are writing from!"
            rows={5}
            className="w-full rounded-2xl border border-white/30 bg-white/10 p-4 text-white placeholder-white/60 outline-none backdrop-blur
                       focus:border-white focus:ring-2 focus:ring-white/40"
            spellCheck={false}
            maxLength={2000}
          />
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>{rev.length}/2000</span>
            <button
              onClick={() => submit('review')}
              disabled={loading}
              className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-white shadow-sm backdrop-blur
                         hover:bg-white/15 disabled:opacity-60"
            >
              Send letter
            </button>
          </div>
        </section>

        {/* Quick links (same vibe as walls) */}
        <div className="mt-10 text-sm text-white/80">
          <span className="mr-2">Browse the walls:</span>
          <a className="underline decoration-white/50 underline-offset-4 hover:decoration-white" href="/wall/messages">
            Unspoken words
          </a>
          <span className="mx-2">•</span>
          <a className="underline decoration-white/50 underline-offset-4 hover:decoration-white" href="/wall/reviews">
            Letters to Geloy
          </a>
        </div>
      </div>
    </main>
  );
}
