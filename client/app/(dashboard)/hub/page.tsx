'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Textarea, Alert } from '@/components/ui/index';
import { Globe, BookOpen, TrendingUp, FileArchive, Search, Plus, Upload, ArrowRight } from 'lucide-react';

type Tab = 'digest' | 'impact' | 'minutes';

export default function HubPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('digest');
  const [digests, setDigests] = useState<any[]>([]);
  const [impact, setImpact] = useState<any[]>([]);
  const [minutes, setMinutes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [digestForm, setDigestForm] = useState({ title: '', quarter: '', year: new Date().getFullYear(), summary: '', content: '' });
  const [minuteForm, setMinuteForm] = useState({ title: '', description: '', meetingDate: '', tags: '' });
  const [minuteFile, setMinuteFile] = useState<File | null>(null);

  const canManage = ['secretariat', 'admin'].includes(user?.role || '');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [d, i, m] = await Promise.all([
        api.get('/hub/digests'),
        api.get('/hub/impact'),
        api.get(`/hub/minutes${search ? `?search=${search}` : ''}`),
      ]);
      setDigests(d.data);
      setImpact(i.data);
      setMinutes(m.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (tab === 'minutes') {
      api.get(`/hub/minutes${search ? `?search=${search}` : ''}`).then(({ data }) => setMinutes(data));
    }
  }, [search, tab]);

  const handleCreateDigest = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const { data } = await api.post('/hub/digests', digestForm);
      setDigests([data, ...digests]);
      setShowForm(false);
      setDigestForm({ title: '', quarter: '', year: new Date().getFullYear(), summary: '', content: '' });
    } catch (e: any) { setError(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleUploadMinute = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(minuteForm).forEach(([k, v]) => {
        if (k === 'tags') fd.append(k, JSON.stringify(v.split(',').map((t: string) => t.trim()).filter(Boolean)));
        else fd.append(k, v as string);
      });
      if (minuteFile) fd.append('file', minuteFile);
      const { data } = await api.post('/hub/minutes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMinutes([data, ...minutes]);
      setShowForm(false);
      setMinuteForm({ title: '', description: '', meetingDate: '', tags: '' });
      setMinuteFile(null);
    } catch (e: any) { setError(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'digest', label: 'Quarterly Digest', icon: BookOpen },
    { id: 'impact', label: 'Impact Tracking', icon: TrendingUp },
    { id: 'minutes', label: 'Minutes Archive', icon: FileArchive },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Globe size={24} />Public Hub</h1>
          <p className="text-slate-500 mt-1">Transparency centre — see how your feedback drives change</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'default'}>
            <Plus size={16} /> Add Content
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {/* Digest Tab */}
      {tab === 'digest' && (
        <>
          {showForm && canManage && (
            <Card className="mb-6 border-emerald-200">
              <CardHeader><CardTitle className="text-base">New Quarterly Digest</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDigest} className="space-y-4">
                  {error && <Alert variant="danger">{error}</Alert>}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1"><Label>Title</Label><Input value={digestForm.title} onChange={e => setDigestForm({...digestForm, title: e.target.value})} required /></div>
                    <div className="space-y-1"><Label>Quarter</Label><Input value={digestForm.quarter} onChange={e => setDigestForm({...digestForm, quarter: e.target.value})} placeholder="Q1 2025" /></div>
                  </div>
                  <div className="space-y-1"><Label>Summary (shown on card)</Label><Input value={digestForm.summary} onChange={e => setDigestForm({...digestForm, summary: e.target.value})} /></div>
                  <div className="space-y-1"><Label>Full Content</Label><Textarea value={digestForm.content} onChange={e => setDigestForm({...digestForm, content: e.target.value})} rows={5} /></div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Publishing…' : 'Publish'}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          <div className="space-y-4">
            {digests.length === 0 && <div className="text-center py-16 text-slate-400">No digests published yet</div>}
            {digests.map((d: any) => (
              <Card key={d._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {d.quarter && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{d.quarter}</span>}
                        <span className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{d.title}</h3>
                      {d.summary && <p className="text-slate-600 text-sm mb-3">{d.summary}</p>}
                      {d.content && <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">{d.content}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Impact Tab */}
      {tab === 'impact' && (
        <Card>
          <CardHeader><CardTitle className="text-base">What Your Feedback Changed</CardTitle></CardHeader>
          <CardContent>
            {impact.length === 0 ? (
              <div className="text-center py-16 text-slate-400">No resolved cases published yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">ID</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">Issue Raised</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">Action Taken</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">What Changed</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">Resolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impact.map((c: any) => (
                      <tr key={c._id} className="border-b border-slate-50 align-top">
                        <td className="py-3 px-4 font-mono text-xs text-emerald-600">{c.trackingId}</td>
                        <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">
                          <p>{c.title}</p>
                          <p className="text-xs text-slate-400">{c.category} · {c.department}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs text-xs">{c.actionTaken || '—'}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs text-xs">{c.whatChanged || '—'}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Minutes Tab */}
      {tab === 'minutes' && (
        <>
          {showForm && canManage && (
            <Card className="mb-6 border-emerald-200">
              <CardHeader><CardTitle className="text-base">Upload Meeting Minutes</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleUploadMinute} className="space-y-4">
                  {error && <Alert variant="danger">{error}</Alert>}
                  <div className="space-y-1"><Label>Title</Label><Input value={minuteForm.title} onChange={e => setMinuteForm({...minuteForm, title: e.target.value})} required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Meeting Date</Label><Input type="date" value={minuteForm.meetingDate} onChange={e => setMinuteForm({...minuteForm, meetingDate: e.target.value})} /></div>
                    <div className="space-y-1"><Label>Tags (comma separated)</Label><Input value={minuteForm.tags} onChange={e => setMinuteForm({...minuteForm, tags: e.target.value})} placeholder="HR, Safety, Q1" /></div>
                  </div>
                  <div className="space-y-1"><Label>Description</Label><Textarea value={minuteForm.description} onChange={e => setMinuteForm({...minuteForm, description: e.target.value})} rows={2} /></div>
                  <div className="space-y-1">
                    <Label>PDF Document</Label>
                    <label className="flex items-center gap-3 p-3 border border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <Upload size={18} className="text-slate-400" />
                      <span className="text-sm text-slate-500">{minuteFile ? minuteFile.name : 'Choose PDF file'}</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={e => setMinuteFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Uploading…' : 'Upload'}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Search minutes by title, description or tags…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="space-y-3">
            {minutes.length === 0 && <div className="text-center py-16 text-slate-400">No meeting minutes uploaded yet</div>}
            {minutes.map((m: any) => (
              <Card key={m._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {m.meetingDate && <span className="text-xs text-slate-400">{new Date(m.meetingDate).toLocaleDateString()}</span>}
                        {m.tags?.map((tag: string) => <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>)}
                      </div>
                      <h3 className="font-semibold text-slate-900">{m.title}</h3>
                      {m.description && <p className="text-sm text-slate-500 mt-1">{m.description}</p>}
                      <p className="text-xs text-slate-400 mt-1">Uploaded by {m.uploadedBy?.name}</p>
                    </div>
                    {m.filename && (
                      <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api','')}/uploads/${m.filename}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-sm text-emerald-600 hover:underline whitespace-nowrap">
                        View PDF <ArrowRight size={14} />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
