'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import Link from 'next/link';
import { FileText, AlertTriangle, CheckCircle2, Clock, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'staff') {
          const { data } = await api.get('/cases/submitted');
          setCases(data);
        } else if (user?.role === 'case_manager') {
          const { data } = await api.get('/cases/my-cases');
          setCases(data);
        } else {
          const [casesRes, analyticsRes] = await Promise.all([
            api.get('/cases'),
            api.get('/cases/analytics/summary'),
          ]);
          setCases(casesRes.data);
          setAnalytics(analyticsRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = analytics ? {
    total: cases.length,
    open: cases.filter(c => !['Resolved'].includes(c.status)).length,
    escalated: analytics.byStatus.find((s: any) => s._id === 'Escalated')?.count || 0,
    resolved: analytics.byStatus.find((s: any) => s._id === 'Resolved')?.count || 0,
  } : {
    total: cases.length,
    open: cases.filter(c => !['Resolved'].includes(c.status)).length,
    escalated: cases.filter(c => c.status === 'Escalated').length,
    resolved: cases.filter(c => c.status === 'Resolved').length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-1 capitalize">{user?.role?.replace('_', ' ')} · {user?.department}</p>
        </div>
        <Link href="/cases/new">
          <Button className="flex items-center gap-2">
            <Plus size={16} /> Submit Issue
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Cases</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <FileText className="text-slate-600" size={22} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Open</p>
                <p className="text-3xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Clock className="text-blue-600" size={22} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Escalated</p>
                <p className="text-3xl font-bold text-red-600">{stats.escalated}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={22} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Resolved</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600" size={22} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent cases table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Cases</CardTitle>
            {user?.role !== 'staff' && (
              <Link href="/cases" className="text-sm text-emerald-600 hover:underline">View all</Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText size={40} className="mx-auto mb-3 opacity-40" />
              <p>No cases yet</p>
              <Link href="/cases/new" className="text-emerald-600 text-sm hover:underline mt-1 block">Submit your first case</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Tracking ID</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Title</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Category</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Severity</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.slice(0, 10).map((c: any) => (
                    <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2">
                        <Link href={`/cases/${c._id}`} className="text-emerald-600 hover:underline font-mono text-xs">
                          {c.trackingId}
                        </Link>
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-900 max-w-xs truncate">{c.title}</td>
                      <td className="py-3 px-2 text-slate-600">{c.category}</td>
                      <td className="py-3 px-2"><SeverityBadge severity={c.severity} /></td>
                      <td className="py-3 px-2"><StatusBadge status={c.status} /></td>
                      <td className="py-3 px-2 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
