import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED = ['message', 'review', 'bright'] as const;
type Kind = (typeof ALLOWED)[number];

function getSupabase(admin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

  // Prefer service role for writes if available; otherwise fall back to anon.
  const key = admin && service ? service : anon;
  if (!key)
    throw new Error(
      'Missing Supabase key (set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    );

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    // Accept either { text } or { content } to match all callers
    const body = (await req.json().catch(() => ({}))) as {
      type?: string;
      text?: string;
      content?: string;
    };

    const type = body?.type;
    const rawText = (body?.text ?? body?.content) as string | undefined;
    const text = typeof rawText === 'string' ? rawText.trim() : '';

    if (!text || text.length === 0 || text.length > 2000) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }
    if (!type || !ALLOWED.includes(type as Kind)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const supabase = getSupabase(true); // admin preferred (falls back to anon if needed)

    const { error } = await supabase.from('items').insert({
      content: text,
      type,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
