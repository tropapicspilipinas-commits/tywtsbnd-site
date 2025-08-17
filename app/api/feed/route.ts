import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Candidate table names we'll try in order
const CANDIDATES = ['items','messages','entries','posts','letters','submissions','notes'];

function getSupabase(admin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) return null;
  // Prefer anon for reads; fall back to service if anon missing.
  const key = admin && service ? service : (anon ?? service);
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

function normalizeRow(row: any) {
  const id = row.id ?? row.uuid ?? row._id ?? null;
  const content = row.content ?? row.text ?? row.body ?? row.message ?? '';
  const type = row.type ?? row.kind ?? row.category ?? 'message';
  const created_at = row.created_at ?? row.inserted_at ?? row.createdAt ?? row.created ?? null;

  // Normalize "approved" / "status"
  let status: string | undefined = undefined;
  if (typeof row.status === 'string') status = row.status;
  else if (typeof row.approved === 'boolean') status = row.approved ? 'approved' : 'pending';

  return { id, content, type, created_at, status };
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase(false);
    if (!supabase) {
      return NextResponse.json({ items: [], error: 'Supabase keys missing' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('type');

    const table = await findTable(supabase);
    if (!table) {
      return NextResponse.json({ items: [], error: 'No suitable table found (tried items/messages/entries/...)' }, { status: 500 });
    }

    // First try the common columns & status filter.
    let { data, error } = await supabase
      .from(table)
      .select('id, content, type, created_at, status, approved')
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback: select everything and sort locally if needed
      const alt = await supabase.from(table).select('*');
      if (alt.error) {
        return NextResponse.json({ items: [], error: alt.error.message }, { status: 500 });
      }
      data = alt.data as any[];
    }

    const normalized = (data as any[]).map(normalizeRow);

    // Respect "approved" if we can detect it; otherwise rely on your RLS
    const approvedOnly = normalized.filter(r => (r.status ? r.status === 'approved' : true));

    const byType = filterType
      ? approvedOnly.filter(r => (r.type ?? 'message') === filterType)
      : approvedOnly;

    // Map back to the exact shape the UI expects
    const items = byType.map(r => ({
      id: r.id,
      content: r.content,
      type: r.type,
      created_at: r.created_at ?? new Date().toISOString(),
      status: r.status ?? undefined,
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
