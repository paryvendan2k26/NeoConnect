'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { BarChart2, AlertTriangle, Flame } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  'New': '#3b82f6', 'Assigned': '#8b5cf6', 'In Progress': '#f59e0b',
  'Pending': '#94a3b8', 'Resolved': '#10b981', 'Escalated': '#ef4444',
};
const CAT_COLORS = ['#059669','#0891b2','#7c3aed','#d97706','#dc2626','#db2777'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cases/analytics/summary').then(({ data }) => setAnalytics(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" /></div>;
  if (!analytics) return null;

  const { byStatus, byCategory, byDepartment, hotspots } = analytics;

  const totalCases = byStatus.reduce((s: number, d: any) => s + d.count, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><BarChart2 size={24} />Analytics</h1>
        <p className="text-slate-500 mt-1">Platform-wide insights and department hotspots</p>
      </div>

      {/* Hotspot alerts */}
      {hotspots?.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><Flame size={18} className="text-red-500" />Hotspot Alerts</h2>
          {hotspots.map((h: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800">{h._id.department} — {h._id.category}</p>
                <p className="text-sm text-red-600">{h.count} open cases with the same category in this department</p>
              </div>
              <span className="ml-auto text-2xl font-bold text-red-700">{h.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {byStatus.map((s: any) => (
          <Card key={s._id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{s._id}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: STATUS_COLORS[s._id] || '#64748b' }}>{s.count}</p>
                </div>
                <div className="w-3 h-10 rounded-full" style={{ backgroundColor: STATUS_COLORS[s._id] || '#94a3b8' }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Dept bar chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Open Cases by Department</CardTitle></CardHeader>
          <CardContent>
            {byDepartment.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No open cases</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDepartment} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="_id" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {byDepartment.map((_: any, i: number) => (
                        <Cell key={i} fill={i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#059669'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Cases by Category</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={(props: any) => `${props._id} ${((props.percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {byCategory.map((_: any, i: number) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus} margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {byStatus.map((s: any, i: number) => <Cell key={i} fill={STATUS_COLORS[s._id] || '#94a3b8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
