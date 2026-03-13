'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, Select } from '@/components/ui/index';
import { AlertCircle } from 'lucide-react';

const DEPARTMENTS = ['Engineering', 'HR', 'Operations', 'Finance', 'IT', 'Management', 'Facilities', 'Legal', 'Other'];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', role: 'staff' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <span className="font-bold text-white text-lg">N</span>
            </div>
            <span className="font-bold text-2xl text-slate-900">NeoConnect</span>
          </div>
          <p className="text-slate-500 text-sm">Create your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Join the NeoConnect platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jane Smith" required />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@company.com" required />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 6 characters" required />
              </div>
              <div className="space-y-1">
                <Label>Department</Label>
                <Select value={form.department} onChange={e => setForm({...form, department: e.target.value})} required>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="staff">Staff</option>
                  <option value="case_manager">Case Manager</option>
                  <option value="secretariat">Secretariat</option>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
            <p className="text-center text-sm text-slate-500 mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-slate-900 font-medium hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
