import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value || null;
  const ok = await verifyAdminToken(token);
  if (!ok) return NextResponse.json({ auth: false }, { status: 401 });
  return NextResponse.json({ auth: true });
}
