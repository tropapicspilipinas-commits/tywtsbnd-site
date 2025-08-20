import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const c = cookies().get(COOKIE_NAME);
  const token = c?.value || null;
  const ok = await verifyAdminToken(token);
  return NextResponse.json({
    cookiePresent: Boolean(token),
    cookieName: c?.name || null,
    httpOnly: c?.httpOnly ?? null,
    sameSite: c?.sameSite ?? null,
    secure: c?.secure ?? null,
    ok
  });
}
