import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth';
import { getAdminClient } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(req) {
  const token = cookies().get(COOKIE_NAME)?.value || null;
  const ok = await verifyAdminToken(token);
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabaseAdmin = getAdminClient();

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
