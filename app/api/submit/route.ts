import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Read env (works locally + on Vercel)
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: 'env_missing' }, { status: 500 });
  }

  // Create client at request time (not at build time)
  const supabase = createClient(url, key);

  try {
    const { type, text } = await req.json();

    // Accept both our UI names and friendlier aliases
    const allowed = ['message', 'review', 'prompt', 'letter'];
    if (!allowed.includes(type)) {
      return NextResponse.json({ error: 'invalid type' }, { status: 400 });
    }
    // Map aliases to the DB values we use
    const dbType = type === 'prompt' ? 'message'
                  : type === 'letter' ? 'review'
                  : type;

    const content = String(text || '').trim();
    if (!content || content.length > 2000) {
      return NextResponse.json({ error: 'invalid text' }, { status: 400 });
    }

    // RLS-safe: just insert; do NOT .select() the row (pending rows aren't readable)
    const { error } = await supabase
      .from('submissions')
      .insert({ type: dbType, content, status: 'pending' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Simple success response
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
