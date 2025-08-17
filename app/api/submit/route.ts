import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-side only
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

const ALLOWED = ['message', 'review', 'bright'] as const;
type Kind = typeof ALLOWED[number];

export async function POST(req: Request) {
  try {
    const { type, text } = (await req.json()) as { type?: string; text?: string };

    if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > 2000) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }

    if (!type || !ALLOWED.includes(type as Kind)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const { error } = await supabase
      .from('items')
      .insert({
        content: text.trim(),
        type,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
