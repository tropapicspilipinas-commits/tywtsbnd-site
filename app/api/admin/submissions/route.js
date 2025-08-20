import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth';
import { getAdminClient } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req) {
  const token = (await cookies()).get(COOKIE_NAME)?.value || null;
  const ok = await verifyAdminToken(token);
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabaseAdmin = getAdminClient();

  const url = new URL(req.url);
  const status = url.searchParams.get('status'); // 'pending' | 'approved' | 'rejected'
  const type = url.searchParams.get('type');     // 'review' | 'message'

  let query = supabaseAdmin
    .from('submissions')
    .select('id, type, content, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (status) query = query.eq('status', status);
  if (type && (type === 'review' || type === 'message')) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    { submissions: data || [] },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
