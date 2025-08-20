import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED = ['message', 'review', 'bright'] as const;
type Kind = (typeof ALLOWED)[number];

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  // Prefer service role on server for reliable writes; fall back to anon in dev
  const key = service || anon;
  if (!key) throw new Error('Missing Supabase key (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  return createClient(url, key, { auth: { persistSession: false } });
}

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // Accept either { text } or { content } from callers
    const body = (await req.json().catch(() => ({}))) as {
      type?: string;
      text?: string;
      content?: string;
    };

    const type = body?.type;
    const rawText = body?.text ?? body?.content;
    const text = typeof rawText === 'string' ? rawText.trim() : '';

    if (!type || !(ALLOWED as readonly string[]).includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    if (!text || text.length === 0 || text.length > 2000) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('items')
      .insert({ content: text, type, status: 'pending' })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(
      { ok: true, id: data?.id ?? null },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
