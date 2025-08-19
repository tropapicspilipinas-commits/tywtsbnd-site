import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED = ['message', 'review', 'bright'] as const;

function getSupabase(admin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

  // For reads, anon is usually fine; use service if present.
  const key = admin && service ? service : (anon ?? service);
  if (!key) throw new Error('Missing Supabase key (set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY)');

  return createClient(url, key);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const supabase = getSupabase(false);

    let query = supabase
      .from('items')
      .select('id, content, type, created_at, status')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (type && ALLOWED.includes(type as any)) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ items: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: Array.isArray(data) ? data : [] });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
