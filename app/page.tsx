'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [msg, setMsg] = useState('');
  const [rev, setRev] = useState('');
  const [bright, setBright] = useState('');
  const [loading, setLoading] = useState(false);
  const [thanksKind, setThanksKind] = useState<null | 'message' | 'review' | 'bright'>(null);

  // single-line class strings
  const inputClass = "w-full rounded-2xl border border-white/30 bg-white/10 p-4 text-white placeholder-white/60 outline-none backdrop-blur focus:border-white focus:ring-2 focus:ring-white/40";
  const btnClass = "rounded-full border border-white/30 bg-white/10 px-4 py-2 text-white shadow-sm backdrop-blur hover:bg-white/15 disabled:opacity-60";
  const h2Class = "text-lg font-medium drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]";
  const linkClass = "underline decoration-white/50 underline-offset-4 hover:decoration-white";

  async function submit(kind: 'message' | 'review' | 'bright') {
    const text = kind === 'message' ? msg.trim() : kind === 'review' ? rev.trim() : bright.trim();
    if (!text) { setThanksKind(null); return; }
    if (text.length > 2000) { window.alert('Max 2000 characters.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: kind, text }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) { window.alert(data?.error || 'Submission failed'); return; }

      if (kind === 'message') setMsg('');
      else if (kind === 'review') setRev('');
      else setBright('');

      setThanksKind(kind);
    } catch {
      window.alert('Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!thanksKind) return;
    const t = setTimeout(() => setThanksKind(null), 4500);
    return () => clearTimeout(t);
  }, [thanksKind]);

  const Background = () => (
    <>
      <div className="fixed inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: 'url(/bg/night-sky-film.jpg)' }} />
      <div className="fixed inset-0 -z-10 bg-black/60" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_55%,rgba(0,0,0,0.35)_80%,rgba(0,0,0,0.6)_100%)]" />
    </>
  );

  return (
    <main className="min-h-screen text-white">
      <Background />

      {/* Thank-you toast */}
      {thanksKind && (
        <div aria-live="polite" className="fixed left-1/2 top-6 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.35)] animate-fadeUp">
          <div className="flex items-start gap-3">
            <div className="relative h-6 w-6 shrink-0">
              <Image src="/handdrawn/star.png" alt="" fill sizes="24px" className="animate-pop" />
            </div>
            <div className="leading-relaxed">
              Thank you—your {thanksKind === 'message' ? 'message' : thanksKind === 'review' ? 'letter' : 'note'} was received and is now pending moderation. <a className="underline decoration-white/60 hover:decoration-white" href="/wall/messages">Unspoken words</a> • <a className="underline decoration-white/60 hover:decoration-white" href="/wall/reviews">Letters to Geloy</a> • <a className="underline decoration-white/60 hover:decoration-white" href="/wall/bright">Brighten up someone’s day</a>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6">
          <h1 className="sr-only">Things you wanted to say but never did</h1>
          <div className="flex flex-col gap-2">
            <div className="w-full max-w-[760px]">
              <img src="/handdrawn/title.png" alt="Things you wanted to say but never did" className="h-auto w-full drop-shadow-[0_0_16px_rgba(255,255,255,0.35)]" />
            </div>
            <nav className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80">
              <a className={linkClass} href="/wall/messages">Unspoken words</a>
              <span className="opacity-80">•</span>
              <a className={linkClass} href="/wall/reviews">Letters to Geloy</a>
              <span className="opacity-80">•</span>
              <a className={linkClass} href="/wall/bright">Brighten up someone’s day</a>
            </nav>
          </div>
        </header>

        {/* Unspoken words */}
        <section className="space-y-3">
          <h2 className={h2Class}>Share your unspoken words</h2>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="What’s something you wanted to say but never did?" rows={5} className={inputClass} spellCheck={false} maxLength={2000} />
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>{msg.length}/2000</span>
            <button onClick={() => submit('message')} disabled={loading} className={btnClass}>Submit anonymously</button>
          </div>
        </section>

        {/* Letters to Geloy */}
        <section className="mt-8 space-y-3">
          <h2 className={h2Class}>A note to Geloy</h2>
          <textarea value={rev} onChange={(e) => setRev(e.target.value)} placeholder="How does this project affect you? Anything you want to say to Geloy. And if you can, tell him where you are writing from!" rows={5} className={inputClass} spellCheck={false} maxLength={2000} />
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>{rev.length}/2000</span>
            <button onClick={() => submit('review')} disabled={loading} className={btnClass}>Send letter</button>
          </div>
        </section>

        {/* Brighten up someone’s day */}
        <section className="mt-8 space-y-3">
          <h2 className={h2Class}>Brighten up someone’s day</h2>
          <textarea value={bright} onChange={(e) => setBright(e.target.value)} placeholder="Stories of hope, words for someone who might be having a hard time..." rows={5} className={inputClass} spellCheck={false} maxLength={2000} />
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>{bright.length}/2000</span>
            <button onClick={() => submit('bright')} disabled={loading} className={btnClass}>Send encouragement</button>
          </div>
        </section>

        <div className="mt-10 text-sm text-white/80">
          <span className="mr-2">Browse the walls:</span>
          <a className={linkClass} href="/wall/messages">Unspoken words</a>
          <span className="mx-2">•</span>
          <a className={linkClass} href="/wall/reviews">Letters to Geloy</a>
          <span className="mx-2">•</span>
          <a className={linkClass} href="/wall/bright">Brighten up someone’s day</a>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeUp { 0% { opacity: 0; transform: translate(-50%, 10px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fadeUp { animation: fadeUp 280ms ease-out; }
        @keyframes pop { 0% { transform: scale(0.6) rotate(0deg); opacity: 0; } 60% { transform: scale(1.12) rotate(8deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        .animate-pop { animation: pop 360ms cubic-bezier(.2,.8,.2,1); }
      `}</style>
    </main>
  );
}
