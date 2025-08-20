import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const token = cookies().get(COOKIE_NAME)?.value || null;
  const ok = await verifyAdminToken(token);
  if (!ok) {
    redirect('/admin/login');
  }
  return <AdminDashboardClient />;
}
