import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TABLE = 'submissions';
const ALLOWED = ['message', 'review'] as const;
type Kind = typeof ALLOWED[number];

function getClient(admin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  const key = admin ? (service ?? anon) : (anon ?? service);
  if (!key) throw new Error('Missing Supabase key');
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const { type, text } = (await req.json().catch(() => ({}))) as {
      type?: string;
      text?: string;
    };

    if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > 2000) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }
    if (!type || !ALLOWED.includes(type as Kind)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const supabase = getClient(true); // prefer service role for inserts
    const { error } = await supabase.from(TABLE).insert({
      content: text.trim(),
      type,
      status: 'pending', // your table uses 'status' moderation; rows start pending
      created_at: new Date().toISOString(),
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
