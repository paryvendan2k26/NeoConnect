'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, Textarea, Select, Label, Badge, Alert, Separator } from '@/components/ui/index';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import { ArrowLeft, UserCheck, MessageSquare, Paperclip, Send, EyeOff } from 'lucide-react';

const STATUSES = ['New', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Escalated'];

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [caseManagers, setCaseManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [noteInternal, setNoteInternal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [impactSummary, setImpactSummary] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [whatChanged, setWhatChanged] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await api.get(`/cases/${id}`);
        setCaseData(data);
        setNewStatus(data.status);
        setImpactSummary(data.impactSummary || '');
        setActionTaken(data.actionTaken || '');
        setWhatChanged(data.whatChanged || '');
        if (['secretariat', 'admin'].includes(user?.role || '')) {
          const res = await api.get('/users/case-managers');
          setCaseManagers(res.data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadData();
  }, [id]);

  const handleAssign = async () => {
    if (!assignTo) return;
    setUpdating(true);
    try {
      const { data } = await api.patch(`/cases/${id}/assign`, { assignedTo: assignTo });
      setCaseData(data);
      setAssignTo('');
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to assign'); }
    finally { setUpdating(false); }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setError('');
    try {
      const { data } = await api.patch(`/cases/${id}/update`, { status: newStatus, impactSummary, actionTaken, whatChanged });
      setCaseData(data);
    } catch (e: any) { setError(e.response?.data?.message || 'Update failed'); }
    finally { setUpdating(false); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setUpdating(true);
    try {
      const { data } = await api.patch(`/cases/${id}/update`, { note: { text: noteText, isInternal: noteInternal } });
      setCaseData(data);
      setNoteText('');
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to add note'); }
    finally { setUpdating(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" /></div>;
  if (!caseData) return <div className="p-8 text-slate-500">Case not found.</div>;

  const canManage = ['secretariat', 'admin', 'case_manager'].includes(user?.role || '');
  const canAssign = ['secretariat', 'admin'].includes(user?.role || '');

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{caseData.trackingId}</span>
            <StatusBadge status={caseData.status} />
            <SeverityBadge severity={caseData.severity} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{caseData.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <span>{caseData.category}</span><span>·</span>
            <span>{caseData.department}</span>
            {caseData.location && <><span>·</span><span>{caseData.location}</span></>}
            <span>·</span><span>Submitted {new Date(caseData.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">{caseData.description}</p>
              {caseData.isAnonymous && <div className="flex items-center gap-1 mt-3 text-xs text-slate-400"><EyeOff size={12} /> Submitted anonymously</div>}
            </CardContent>
          </Card>

          {caseData.attachments?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Paperclip size={16} /> Attachments</CardTitle></CardHeader>
              <CardContent>
                {caseData.attachments.map((a: any, i: number) => (
                  <a key={i} href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api','')}/${a.path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-600 hover:underline">
                    <Paperclip size={14} /> {a.originalName}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare size={16} /> Notes & Activity</CardTitle></CardHeader>
            <CardContent>
              {caseData.notes?.length === 0
                ? <p className="text-slate-400 text-sm">No notes yet.</p>
                : <div className="space-y-4">
                    {caseData.notes.map((note: any, i: number) => (
                      <div key={i} className={`p-3 rounded-lg border ${note.isInternal ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-700">{note.addedBy?.name || 'System'}</span>
                          {note.isInternal && <Badge variant="warning">Internal</Badge>}
                          <span className="text-xs text-slate-400 ml-auto">{new Date(note.addedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-700">{note.text}</p>
                      </div>
                    ))}
                  </div>
              }

              {canManage && (
                <div className="mt-4 space-y-2">
                  <Separator className="mb-4" />
                  <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note…" rows={3} />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={noteInternal} onChange={e => setNoteInternal(e.target.checked)} className="rounded" />
                      Internal note
                    </label>
                    <Button size="sm" onClick={handleAddNote} disabled={updating || !noteText.trim()}>
                      <Send size={14} className="mr-1" /> Add Note
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardHeader><CardTitle className="text-base">Impact & Resolution</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1"><Label>Impact Summary</Label><Textarea value={impactSummary} onChange={e => setImpactSummary(e.target.value)} rows={2} /></div>
                <div className="space-y-1"><Label>Action Taken</Label><Textarea value={actionTaken} onChange={e => setActionTaken(e.target.value)} rows={2} /></div>
                <div className="space-y-1"><Label>What Changed</Label><Textarea value={whatChanged} onChange={e => setWhatChanged(e.target.value)} rows={2} /></div>
                <Button onClick={handleUpdate} disabled={updating}>Save Updates</Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Case Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="text-slate-500">Submitted by</p><p className="font-medium">{caseData.isAnonymous ? 'Anonymous' : caseData.submittedBy?.name || '—'}</p></div>
              <Separator />
              <div><p className="text-slate-500">Assigned to</p><p className="font-medium">{caseData.assignedTo?.name || <span className="text-slate-400">Unassigned</span>}</p></div>
              {caseData.assignedAt && <div><p className="text-slate-500">Assigned on</p><p className="font-medium">{new Date(caseData.assignedAt).toLocaleDateString()}</p></div>}
              {caseData.resolvedAt && <><Separator /><div><p className="text-slate-500">Resolved</p><p className="font-medium">{new Date(caseData.resolvedAt).toLocaleDateString()}</p></div></>}
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardHeader><CardTitle className="text-base">Update Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Button className="w-full" size="sm" onClick={handleUpdate} disabled={updating}>Update Status</Button>
              </CardContent>
            </Card>
          )}

          {canAssign && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCheck size={16} /> Assign</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={assignTo} onChange={e => setAssignTo(e.target.value)}>
                  <option value="">Select case manager…</option>
                  {caseManagers.map((cm: any) => <option key={cm._id} value={cm._id}>{cm.name} ({cm.department})</option>)}
                </Select>
                <Button className="w-full" size="sm" onClick={handleAssign} disabled={updating || !assignTo}>Assign Case</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
