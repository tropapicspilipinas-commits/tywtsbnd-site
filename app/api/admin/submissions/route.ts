import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../../lib/adminAuth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const ok = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // 'pending' | 'approved' | 'rejected'
  const type = searchParams.get('type');     // 'review' | 'message'

  let query = supabaseAdmin
    .from('submissions')
    .select('id, type, content, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (status) query = query.eq('status', status);
  if (type && (type === 'review' || type === 'message')) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submissions: data ?? [] });
}

export const __ensureModule = true;
