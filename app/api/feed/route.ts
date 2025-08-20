import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED = ['message', 'review', 'bright'] as const;
type Kind = (typeof ALLOWED)[number];

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  // Use service role for predictable reads under RLS; fall back to anon if needed
  const key = service || anon;
  if (!key) throw new Error('Missing Supabase key (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  return createClient(url, key, { auth: { persistSession: false } });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/feed?type=message|review|bright&limit=200
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServer();

    const url = new URL(req.url);
    const typeParam = url.searchParams.get('type');
    let limit = parseInt(url.searchParams.get('limit') || '200', 10);
    if (!Number.isFinite(limit) || limit <= 0) limit = 200;
    if (limit > 500) limit = 500;

    let query = supabase
      .from('items')
      .select('id, content, type, status, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (typeParam) {
      if ((ALLOWED as readonly string[]).includes(typeParam)) {
        query = query.eq('type', typeParam as Kind);
      } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(
      { items: data || [] },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
