import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED = ['message', 'review', 'bright'] as const;

function getSupabase(admin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) return null;
  // Reads are fine with anon; fall back to service if anon isn’t set.
  const key = admin && service ? service : (anon ?? service);
  if (!key) return null;

  return createClient(url, key);
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase(false);
    if (!supabase) {
      return NextResponse.json(
        { items: [], error: 'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    let query = supabase
      .from('items')
      .select('id, content, type, created_at, status')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (type && ALLOWED.includes(type as any)) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ items: [], error: error.message }, { status: 500 });

    return NextResponse.json({ items: Array.isArray(data) ? data : [] });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
