import { NextResponse } from 'next/server';
import { setAdminSession } from '../../../../lib/adminAuth';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  if (!password) return NextResponse.json({ error: 'Missing password' }, { status: 400 });

  const ok = password === process.env.ADMIN_PASSWORD;
  if (!ok) return NextResponse.json({ error: 'Invalid password' }, { status: 401 });

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
