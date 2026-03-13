'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Input, Select } from '@/components/ui/index';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import { Search, Filter } from 'lucide-react';

const STATUSES = ['', 'New', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Escalated'];
const CATEGORIES = ['', 'Safety', 'Policy', 'Facilities', 'HR', 'Other'];
const SEVERITIES = ['', 'Low', 'Medium', 'High'];

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', severity: '', search: '' });

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.severity) params.severity = filters.severity;
      const { data } = await api.get('/cases', { params });
      setCases(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCases(); }, [filters.status, filters.category, filters.severity]);

  const filtered = filters.search
    ? cases.filter(c =>
        c.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.trackingId.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.department?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : cases;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Case Inbox</h1>
          <p className="text-slate-500 mt-1">{cases.length} total cases</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Search by title, ID, department…" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
            </div>
            <Select className="w-36" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="">All statuses</option>
              {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select className="w-36" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
              <option value="">All categories</option>
              {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select className="w-32" value={filters.severity} onChange={e => setFilters({...filters, severity: e.target.value})}>
              <option value="">All severity</option>
              {SEVERITIES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No cases found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Tracking ID</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Title</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Category</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Department</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Severity</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Assigned To</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c: any) => (
                    <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/cases/${c._id}`} className="text-emerald-600 hover:underline font-mono text-xs font-semibold">
                          {c.trackingId}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">
                        <Link href={`/cases/${c._id}`} className="hover:text-emerald-700 truncate block">{c.title}</Link>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.category}</td>
                      <td className="py-3 px-4 text-slate-600">{c.department}</td>
                      <td className="py-3 px-4"><SeverityBadge severity={c.severity} /></td>
                      <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                      <td className="py-3 px-4 text-slate-600">{c.assignedTo?.name || <span className="text-slate-300">Unassigned</span>}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
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
