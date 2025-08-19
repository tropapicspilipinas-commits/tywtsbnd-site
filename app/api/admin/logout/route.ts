import { NextResponse } from 'next/server';
import { clearAdminSession } from '../../../../lib/adminAuth';

export async function POST() {
  clearAdminSession();
  return NextResponse.json({ ok: true });
}
