import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Same candidates your API will probe
const CANDIDATES = ['items','messages','entries','posts','letters','submissions','notes'];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) return null;
  const key = anon ?? service ?? null;
  if (!key) return null;
  return createClient(url, key);
}

async function findTable(supabase: ReturnType<typeof createClient>) {
  for (const t of CANDIDATES) {
    const { error } = await supabase.from(t).select('id').limit(1);
    if (!error) return t;
  }
  return null;
}

async function countApproved(supabase: ReturnType<typeof createClient>, table: string) {
  // Try status='approved'
  let q = supabase.from(table).select('id', { count: 'exact', head: true }).eq('status','approved');
  let { count, error } = await q;
  if (!error && typeof count === 'number') return { count, mode: "status='approved'" };

  // Try approved=true
  q = supabase.from(table).select('id', { count: 'exact', head: true }).eq('approved', true);
  ({ count, error } = await q);
  if (!error && typeof count === 'number') return { count, mode: 'approved=true' };

  // Fallback: total rows
  q = supabase.from(table).select('id', { count: 'exact', head: true });
  ({ count, error } = await q);
  if (!error && typeof count === 'number') return { count, mode: 'all rows (no moderation col detected)' };

  return { count: null, mode: 'unknown (select failed)' };
}

async function countByType(supabase: ReturnType<typeof createClient>, table: string, type: string) {
  // Prefer status='approved'
  let q = supabase.from(table).select('id', { count: 'exact', head: true }).eq('type', type).eq('status','approved');
  let { count, error } = await q;
  if (!error && typeof count === 'number') return count;

  // approved=true
  q = supabase.from(table).select('id', { count: 'exact', head: true }).eq('type', type).eq('approved', true);
  ({ count, error } = await q);
  if (!error && typeof count === 'number') return count;

  // fallback: by type only
  q = supabase.from(table).select('id', { count: 'exact', head: true }).eq('type', type);
  ({ count, error } = await q);
  if (!error && typeof count === 'number') return count;

  return null;
}

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
    }

    const table = await findTable(supabase);
    if (!table) {
      return NextResponse.json({ error: 'No matching table found', tried: CANDIDATES }, { status: 500 });
    }

    const approved = await countApproved(supabase, table);
    const message = await countByType(supabase, table, 'message');
    const review  = await countByType(supabase, table, 'review');

    // Peek one latest row (normalized lightly)
    const peek = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(1);
    const sample = Array.isArray(peek.data) && peek.data.length ? peek.data[0] : null;

    return NextResponse.json({
      table,
      moderationMode: approved.mode,
      counts: {
        approvedApprox: approved.count,
        byType: { message, review }
      },
      sample
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
