import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // read env (works both locally and on Vercel)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: 'env_missing' }, { status: 500 });

  const supabase = createClient(url, key);

  try {
    const { type, text } = await req.json();

    // Accept the two buttons from the page and friendly names too
    const allowed = ['message', 'review', 'prompt', 'letter'];
    if (!allowed.includes(type)) {
      return NextResponse.json({ error: 'invalid type' }, { status: 400 });
    }
    const dbType = type === 'prompt' ? 'message' : type === 'letter' ? 'review' : type;

    const content = String(text || '').trim();
    if (!content || content.length > 2000) {
      return NextResponse.json({ error: 'invalid text' }, { status: 400 });
    }

    // 👇 IMPORTANT: set status to 'pending' so it passes the policy
    const { data, error } = await supabase
      .from('submissions')
      .insert({ type: dbType, content, status: 'pending' })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
