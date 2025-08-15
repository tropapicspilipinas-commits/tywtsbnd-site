import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: 'env_missing' }, { status: 500 });
  }

  const supabase = createClient(url, key);

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // optional 'message' | 'review'

  let q = supabase
    .from('submissions')
    .select('id, content, type, created_at, status')
    .eq('status', 'approved')                // only show approved on the wall
    .order('created_at', { ascending: false })
    .limit(100);

  if (type === 'message' || type === 'review') {
    q = q.eq('type', type);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}
