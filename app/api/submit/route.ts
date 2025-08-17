import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED = ['message', 'review', 'bright'] as const;
type Kind = typeof ALLOWED[number];

function getSupabase(admin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) return null;
  // Prefer service key for writes; fall back to anon if needed.
  const key = admin && service ? service : (anon ?? service);
  if (!key) return null;

  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = (body?.type ?? '') as string;
    const text = (body?.text ?? '') as string;

    if (typeof text !== 'string' || text.trim().length === 0 || text.length > 2000) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }
    if (!ALLOWED.includes(type as Kind)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const supabase = getSupabase(true);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and (optionally) SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from('items')
      .insert({
        content: text.trim(),
        type,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
