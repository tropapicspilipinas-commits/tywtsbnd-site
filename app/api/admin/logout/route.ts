import { NextResponse } from 'next/server';
import { clearAdminSession } from '../../../../lib/adminAuth';

export const runtime = 'nodejs';

export async function POST() {
  clearAdminSession();
  return NextResponse.json({ ok: true });
}

export const __ensureModule = true;
