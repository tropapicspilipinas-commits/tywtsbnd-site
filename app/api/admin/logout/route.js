import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '../../../../lib/adminAuth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // delete
  });
  return res;
}
