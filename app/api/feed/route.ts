import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED = ['message', 'review', 'bright'] as const;
type Kind = (typeof ALLOWED)[number];

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!svc) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, svc, { auth: { persistSession: false } });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchApproved(
  supabase: ReturnType<typeof createClient>,
  table: 'items' | 'submissions',
  typeParam: string | null,
  limit: number
) {
  let q = supabase
    .from(table)
    .select('id, content, type, status, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (typeParam) q = q.eq('type', typeParam as Kind);
  return q;
}

// GET /api/feed?type=message|review|bright&limit=200
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const typeParam = url.searchParams.get('type');
    let limit = parseInt(url.searchParams.get('limit') || '200', 10);
    if (!Number.isFinite(limit) || limit <= 0) limit = 200;
    if (limit > 500) limit = 500;

    if (typeParam && !ALLOWED.includes(typeParam as Kind)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // 1) Try items
    let { data, error } = await fetchApproved(supabase, 'items', typeParam, limit);
    // 2) If table missing, fallback to submissions
    if (error && /schema cache|does not exist/i.test(error.message)) {
      ({ data, error } = await fetchApproved(supabase, 'submissions', typeParam, limit));
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(
      { items: data || [] },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
