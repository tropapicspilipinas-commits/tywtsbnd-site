import { NextResponse } from 'next/server';
import { setAdminSession } from '../../../../lib/adminAuth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  if (!password) return NextResponse.json({ error: 'Missing password' }, { status: 400 });
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Server missing ADMIN_PASSWORD' }, { status: 500 });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  await setAdminSession();
  return NextResponse.json({ ok: true });
}

// Ensure module (guards against weird paste issues)
export const __ensureModule = true;
