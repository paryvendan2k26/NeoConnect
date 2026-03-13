'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, Select, Switch, Card, CardContent, CardHeader, CardTitle, CardDescription, Alert } from '@/components/ui/index';
import { CheckCircle2, Upload, X } from 'lucide-react';

const CATEGORIES = ['Safety', 'Policy', 'Facilities', 'HR', 'Other'];
const DEPARTMENTS = ['Engineering', 'HR', 'Operations', 'Finance', 'IT', 'Management', 'Facilities', 'Legal', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High'];

export default function NewCasePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', category: '', department: '', location: '', severity: 'Low', isAnonymous: false,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      files.forEach(f => fd.append('attachments', f));
      const { data } = await api.post('/cases', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(data.trackingId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-emerald-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Case Submitted</h2>
            <p className="text-slate-500 mb-4">Your case has been received and will be reviewed shortly.</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-6 inline-block">
              <p className="text-xs text-slate-500 mb-1">Your tracking ID</p>
              <p className="font-mono font-bold text-xl text-slate-900">{success}</p>
            </div>
            <p className="text-sm text-slate-400 mb-6">Keep this ID to track your case status</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
              <Button onClick={() => { setSuccess(null); setForm({ title: '', description: '', category: '', department: '', location: '', severity: 'Low', isAnonymous: false }); setFiles([]); }}>
                Submit Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Submit an Issue</h1>
        <p className="text-slate-500 mt-1">Your submission will get a unique tracking ID. You can submit anonymously.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert variant="danger">{error}</Alert>}

            <div className="space-y-1">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Brief summary of the issue" required />
            </div>

            <div className="space-y-1">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the issue in detail..." rows={4} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Severity</Label>
                <Select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
                  {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Department <span className="text-red-500">*</span></Label>
                <Select value={form.department} onChange={e => setForm({...form, department: e.target.value})} required>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Floor 3, Room 204" />
              </div>
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-medium text-slate-900">Submit Anonymously</p>
                <p className="text-xs text-slate-500">Your name will be hidden from the case</p>
              </div>
              <Switch checked={form.isAnonymous} onCheckedChange={v => setForm({...form, isAnonymous: v})} />
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <Label>Attachments (optional)</Label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors">
                <Upload size={20} className="text-slate-400 mb-2" />
                <span className="text-sm text-slate-500">Click to upload photos or PDFs</span>
                <span className="text-xs text-slate-400">Max 10MB per file</span>
                <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={e => setFiles(Array.from(e.target.files || []))} />
              </label>
              {files.length > 0 && (
                <div className="space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                      <span className="flex-1 truncate">{f.name}</span>
                      <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                        <X size={14} className="text-slate-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Submitting…' : 'Submit Case'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
