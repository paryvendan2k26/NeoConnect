'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Alert } from '@/components/ui/index';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Vote, Plus, X } from 'lucide-react';

export default function PollsPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState<string | null>(null);

  const fetchPolls = async () => {
    const { data } = await api.get('/polls');
    setPolls(data);
    setLoading(false);
  };

  useEffect(() => { fetchPolls(); }, []);

  const hasVoted = (poll: any) => poll.options.some((o: any) =>
    o.votes.includes(user?.id)
  );

  const totalVotes = (poll: any) => poll.options.reduce((s: number, o: any) => s + o.votes.length, 0);

  const handleVote = async (pollId: string, optionIndex: number) => {
    setVoting(pollId);
    try {
      const { data } = await api.post(`/polls/${pollId}/vote`, { optionIndex });
      setPolls(polls.map(p => p._id === pollId ? data : p));
    } catch (e: any) {
      alert(e.response?.data?.message || 'Vote failed');
    } finally { setVoting(null); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const opts = newPoll.options.filter(o => o.trim());
    if (opts.length < 2) { setError('Add at least 2 options'); return; }
    setCreating(true);
    try {
      const { data } = await api.post('/polls', { question: newPoll.question, options: opts });
      setPolls([data, ...polls]);
      setShowCreate(false);
      setNewPoll({ question: '', options: ['', ''] });
    } catch (e: any) { setError(e.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const COLORS = ['#059669','#0891b2','#7c3aed','#d97706','#dc2626','#db2777'];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Vote size={24} />Polls</h1>
          <p className="text-slate-500 mt-1">Vote and see what your colleagues think</p>
        </div>
        {['secretariat', 'admin'].includes(user?.role || '') && (
          <Button onClick={() => setShowCreate(!showCreate)} variant={showCreate ? 'outline' : 'default'}>
            <Plus size={16} /> Create Poll
          </Button>
        )}
      </div>

      {showCreate && (
        <Card className="mb-6 border-emerald-200">
          <CardHeader><CardTitle className="text-base">New Poll</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <Alert variant="danger">{error}</Alert>}
              <div className="space-y-1">
                <Label>Question</Label>
                <Input value={newPoll.question} onChange={e => setNewPoll({...newPoll, question: e.target.value})} placeholder="What do you want to ask?" required />
              </div>
              <div className="space-y-2">
                <Label>Options</Label>
                {newPoll.options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={opt} onChange={e => { const o = [...newPoll.options]; o[i] = e.target.value; setNewPoll({...newPoll, options: o}); }} placeholder={`Option ${i + 1}`} />
                    {newPoll.options.length > 2 && (
                      <button type="button" onClick={() => setNewPoll({...newPoll, options: newPoll.options.filter((_, j) => j !== i)})}>
                        <X size={16} className="text-slate-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
                {newPoll.options.length < 6 && (
                  <button type="button" onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})} className="text-sm text-emerald-600 hover:underline">
                    + Add option
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create Poll'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {polls.length === 0 && <div className="text-center py-16 text-slate-400">No polls yet</div>}
        {polls.map((poll: any) => {
          const voted = hasVoted(poll);
          const total = totalVotes(poll);
          const chartData = poll.options.map((o: any) => ({ name: o.text, votes: o.votes.length }));

          return (
            <Card key={poll._id} className={!poll.isActive ? 'opacity-70' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{poll.question}</CardTitle>
                    <CardDescription>{total} vote{total !== 1 ? 's' : ''} · {poll.isActive ? 'Active' : 'Closed'}</CardDescription>
                  </div>
                  {['secretariat', 'admin'].includes(user?.role || '') && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      const { data } = await api.patch(`/polls/${poll._id}/toggle`);
                      setPolls(polls.map(p => p._id === poll._id ? data : p));
                    }}>{poll.isActive ? 'Close' : 'Reopen'}</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!voted && poll.isActive ? (
                  <div className="space-y-2">
                    {poll.options.map((opt: any, i: number) => (
                      <button key={i} onClick={() => handleVote(poll._id, i)} disabled={voting === poll._id}
                        className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-sm font-medium">
                        {opt.text}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bar chart */}
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                            {chartData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Percentage breakdown */}
                    <div className="space-y-2">
                      {poll.options.map((opt: any, i: number) => {
                        const pct = total > 0 ? Math.round((opt.votes.length / total) * 100) : 0;
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-700">{opt.text}</span>
                              <span className="text-slate-500">{opt.votes.length} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {voted && <p className="text-xs text-slate-400 text-center">✓ You have voted</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
