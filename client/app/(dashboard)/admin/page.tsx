'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { Badge } from '@/components/ui/index';
import { Users, ShieldAlert } from 'lucide-react';

const ROLES = ['staff', 'case_manager', 'secretariat', 'admin'];
const ROLE_COLORS: Record<string, any> = {
  staff: 'default', case_manager: 'info', secretariat: 'purple', admin: 'danger'
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') { router.push('/dashboard'); return; }
    api.get('/users').then(({ data }) => setUsers(data)).finally(() => setLoading(false));
  }, [user]);

  const updateUser = async (id: string, updates: any) => {
    setSaving(id);
    try {
      const { data } = await api.patch(`/users/${id}`, updates);
      setUsers(users.map(u => u._id === id ? data : u));
    } catch {}
    finally { setSaving(null); }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users size={24} />User Administration</h1>
        <p className="text-slate-500 mt-1">{users.length} registered users</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Department</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{u.email}</td>
                    <td className="py-3 px-4 text-slate-600">{u.department || '—'}</td>
                    <td className="py-3 px-4">
                      {u._id === user?.id ? (
                        <Badge variant={ROLE_COLORS[u.role]}>{u.role.replace('_', ' ')}</Badge>
                      ) : (
                        <select
                          value={u.role}
                          disabled={saving === u._id}
                          onChange={e => updateUser(u._id, { role: e.target.value })}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {u._id !== user?.id && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline"
                            onClick={() => updateUser(u._id, { isActive: !u.isActive })}
                            disabled={saving === u._id}>
                            {u.isActive ? 'Disable' : 'Enable'}
                          </Button>
                          <Button size="sm" variant="destructive"
                            onClick={() => deleteUser(u._id, u.name)}
                            disabled={saving === u._id}>
                            Delete
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <ShieldAlert size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Security Note</p>
          <p>Role changes take effect immediately. Disabled users cannot log in. Deleting a user is permanent.</p>
        </div>
      </div>
    </div>
  );
}
