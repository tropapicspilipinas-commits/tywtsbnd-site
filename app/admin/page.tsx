import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  // In your setup cookies() is async
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value || null;

  const ok = await verifyAdminToken(token);
  if (!ok) {
    redirect('/admin/login');
  }
  // Logged in → go to the client dashboard page
  redirect('/admin/dashboard');
}
