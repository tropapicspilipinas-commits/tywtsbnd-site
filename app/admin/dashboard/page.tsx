'use client';

import { useEffect, useState } from 'react';

type Submission = {
  id: string;
  type: 'review' | 'message' | string | null;
  content: string | null;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
};

export default function AdminDashboardPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] =
    useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [typeFilter, setTypeFilter] =
    useState<'all' | 'review' | 'message'>('all');

  async function fetchList() {
    setLoading(true);
    const qs = new URLSearchParams();
    if (statusFilter !== 'all') qs.set('status', statusFilter);
    if (typeFilter !== 'all') qs.set('type', typeFilter);
    const res = await fetch(`/api/admin/submissions?${qs.toString()}`, {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!res.ok) {
      // If session expired, go to login
      window.location.href = '/admin/login';
      return;
    }
    const data = await res.json();
    setItems(data.submissions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  async function act(id: string, action: 'approve' | 'reject') {
    const res = await fetch(`/api/admin/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) {
      alert('Action failed. Please log in again.');
      window.location.href = '/admin/login';
      return;
    }
    await fetchList();
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include', cache: 'no-store' });
    window.location.href = '/admin/login';
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Admin — Submissions</h1>
        <button onClick={logout} className="ml-auto rounded-lg border px-3 py-1 text-sm">
          Logout
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <label className="text-sm">Status</label>
        <select
          className="border rounded px-2 py-1"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>

        <label className="text-sm ml-4">Type</label>
        <select
          className="border rounded px-2 py-1"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
        >
          <option value="all">All</option>
          <option value="review">Reviews</option>
          <option value="message">Messages</option>
        </select>

        <button onClick={fetchList} className="ml-auto rounded-lg border px-3 py-1 text-sm">
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id} className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-70">{new Date(s.created_at).toLocaleString()}</span>
                <span
                  className={`text-xs uppercase tracking-wide ${
                    s.status === 'pending'
                      ? 'text-amber-600'
                      : s.status === 'approved'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <div className="mt-1 text-xs opacity-60">Type: {s.type ?? '—'}</div>
              <p className="mt-2 whitespace-pre-wrap">{s.content ?? ''}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => act(s.id, 'approve')}
                  disabled={s.status === 'approved'}
                  className="rounded-lg bg-black text-white px-3 py-1 text-sm disabled:opacity-40"
                >
                  Approve
                </button>
                <button
                  onClick={() => act(s.id, 'reject')}
                  disabled={s.status === 'rejected'}
                  className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
