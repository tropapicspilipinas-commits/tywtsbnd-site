import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // In your setup, cookies() is async — await it:
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value || null;

  const ok = await verifyAdminToken(token);
  if (!ok) {
    redirect('/admin/login');
  }

  // Logged in → send to the dashboard UI
  redirect('/admin/dashboard');
}
