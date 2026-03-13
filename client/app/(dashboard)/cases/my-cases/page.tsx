'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/index';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import { ShieldCheck, Clock } from 'lucide-react';

export default function MyCasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/cases/my-cases').then(({ data }) => setCases(data)).finally(() => setLoading(false)); }, []);

  const getWorkingDaysSince = (date: string) => {
    const start = new Date(date); const now = new Date(); let days = 0; const cur = new Date(start);
    while (cur < now) { cur.setDate(cur.getDate() + 1); const d = cur.getDay(); if (d !== 0 && d !== 6) days++; }
    return days;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-8">
      <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">My Assigned Cases</h1><p className="text-slate-500 mt-1">{cases.length} cases assigned to you</p></div>
      {cases.length === 0
        ? <Card><CardContent className="py-16 text-center text-slate-400"><ShieldCheck size={40} className="mx-auto mb-3 opacity-40" /><p>No cases assigned to you yet.</p></CardContent></Card>
        : <div className="space-y-3">{cases.map((c: any) => {
            const days = c.assignedAt ? getWorkingDaysSince(c.assignedAt) : 0;
            const overdue = days >= 7 && !['Resolved'].includes(c.status);
            return (
              <Link key={c._id} href={`/cases/${c._id}`}>
                <Card className={`hover:shadow-md transition-shadow cursor-pointer ${overdue ? 'border-red-200' : ''}`}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-emerald-600 font-semibold">{c.trackingId}</span>
                          <StatusBadge status={c.status} /><SeverityBadge severity={c.severity} />
                          {overdue && <span className="text-xs text-red-600 font-medium flex items-center gap-1"><Clock size={12} /> {days}d — overdue</span>}
                        </div>
                        <p className="font-medium text-slate-900 truncate">{c.title}</p>
                        <p className="text-sm text-slate-500">{c.category} · {c.department}</p>
                      </div>
                      <div className="text-right text-xs text-slate-400 shrink-0"><p>Assigned</p><p>{c.assignedAt ? new Date(c.assignedAt).toLocaleDateString() : '—'}</p></div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}</div>
      }
    </div>
  );
}
