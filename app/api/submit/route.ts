import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Candidate table names we'll try in order
const CANDIDATES = ['items','messages','entries','posts','letters','submissions','notes'];

type Kind = 'message' | 'review';

function getSupabase(admin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) return null;
  // Prefer service key for writes; fall back to anon if needed.
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = (body?.type ?? '') as Kind;
    const text = (body?.text ?? '') as string;

    if (typeof text !== 'string' || text.trim().length === 0 || text.length > 2000) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }
    if (type !== 'message' && type !== 'review') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const supabase = getSupabase(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase keys missing' }, { status: 500 });
    }

    const table = await findTable(supabase);
    if (!table) {
      return NextResponse.json({ error: 'No suitable table found (tried items/messages/entries/...)' }, { status: 500 });
    }

    // Try common shapes (most setups use these columns)
    const baseRow: any = { content: text.trim(), type, created_at: new Date().toISOString() };

    // Attempt A: with status column ('pending')
    let { error } = await supabase.from(table).insert({ ...baseRow, status: 'pending' });
    if (error) {
      // Attempt B: boolean approved column
      const tryB = await supabase.from(table).insert({ ...baseRow, approved: false });
      if (tryB.error) {
        // Attempt C: minimal insert (content + type)
        const tryC = await supabase.from(table).insert({ content: baseRow.content, type });
        if (tryC.error) {
          return NextResponse.json({ error: tryC.error.message || tryB.error.message || error.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
