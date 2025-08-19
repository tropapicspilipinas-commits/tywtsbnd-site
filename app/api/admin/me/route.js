import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(req) {
  const ok = await requireAdmin(req);
  if (!ok) return NextResponse.json({ auth: false }, { status: 401 });
  return NextResponse.json({ auth: true });
}
