import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../../lib/adminAuth';

export const runtime = 'nodejs';

export async function POST(req) {
  const ok = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let id;
  try {
    const body = await req.json();
    id = body?.id;
  } catch {}

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('submissions')
    .update({ status: 'approved' })
    .eq('id', id)
    .select('id, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, submission: data });
}

export const __ensureModule = true;
