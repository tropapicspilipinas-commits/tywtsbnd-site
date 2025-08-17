import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TABLE = 'submissions';
const ALLOWED = ['message', 'review'] as const;

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  const key = anon ?? service;
  if (!key) throw new Error('Missing Supabase key');
  return createClient(url, key);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const supabase = getClient();

    let query = supabase
      .from(TABLE)
      .select('id, content, type, created_at, status')
      .eq('status', 'approved') // only show approved
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
