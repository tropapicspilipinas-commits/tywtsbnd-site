import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only key (never exposed to browser)
);

export async function POST(req: NextRequest) {
  try {
    const { type, text } = await req.json();

    // allow friendly names too
    const allowed = ['message', 'review', 'prompt', 'letter'];
    if (!allowed.includes(type)) {
      return NextResponse.json({ error: 'invalid type' }, { status: 400 });
    }
    const dbType = type === 'prompt' ? 'message' : type === 'letter' ? 'review' : type;

    const content = String(text || '').trim();
    if (!content || content.length > 2000) {
      return NextResponse.json({ error: 'invalid text' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('submissions')
      .insert({ type: dbType, content })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
