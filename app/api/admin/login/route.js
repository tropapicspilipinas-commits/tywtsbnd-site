import { NextResponse } from 'next/server';
import { buildSessionToken, COOKIE_NAME } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function POST(req) {
  let password = '';
  try {
    const body = await req.json();
    password = body?.password || '';
  } catch {}

  if (!password) return NextResponse.json({ error: 'Missing password' }, { status: 400 });
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Server missing ADMIN_PASSWORD' }, { status: 500 });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const { token, maxAgeSeconds } = await buildSessionToken();

  const res = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  });
  return res;
}
