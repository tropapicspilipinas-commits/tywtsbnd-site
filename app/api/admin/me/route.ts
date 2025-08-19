import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/adminAuth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const ok = await requireAdmin(req);
  if (!ok) return NextResponse.json({ auth: false }, { status: 401 });
  return NextResponse.json({ auth: true });
}

export const __ensureModule = true;
