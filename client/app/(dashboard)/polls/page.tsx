'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Alert } from '@/components/ui/index';
import { Vote, Plus, CheckCircle2, Users } from 'lucide-react';

export default function PollsPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newPollQ, setNewPollQ] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [newPollEnds, setNewPollEnds] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const isSecretariat = user?.role === 'secretariat';
  const canManage = ['secretariat', 'admin'].includes(user?.role || '');

  const fetchPolls = async () => {
    const { data } = await api.get('/polls');
    setPolls(data);
    setLoading(false);
  };

  useEffect(() => { fetchPolls(); }, []);

  const handleVote = async (pollId: string, optionIdx: number) => {
    try {
      await api.post(`/polls/${pollId}/vote`, { optionIndex: optionIdx });
      fetchPolls(); // re-fetch so hasVoted is derived from server data
    } catch (e: any) {
      setError(e.response?.data?.message || 'Vote failed');
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const opts = newPollOptions.filter(o => o.trim());
      await api.post('/polls', { question: newPollQ, options: opts.map(o => ({ text: o })), endsAt: newPollEnds || undefined });
      setNewPollQ(''); setNewPollOptions(['', '']); setNewPollEnds(''); setShowCreate(false);
      fetchPolls();
    } catch (e: any) { setError(e.response?.data?.message || 'Create failed'); }
    finally { setCreating(false); }
  };

  const handleToggle = async (pollId: string) => {
    await api.patch(`/polls/${pollId}/toggle`);
    fetchPolls();
  };

  const getTotal = (poll: any) => poll.options.reduce((s: number, o: any) => s + (o.votes?.length || 0), 0);

  // Derive hasVoted from server data — survives page refresh
  const userHasVoted = (poll: any): boolean => {
    if (!user) return false;
    return poll.options.some((o: any) =>
      Array.isArray(o.votes) && o.votes.some((v: any) =>
        (typeof v === 'string' ? v : v?._id?.toString() || v?.toString()) === user.id
      )
    );
  };

  const getMyVoteIndex = (poll: any): number => {
    if (!user) return -1;
    return poll.options.findIndex((o: any) =>
      Array.isArray(o.votes) && o.votes.some((v: any) =>
        (typeof v === 'string' ? v : v?._id?.toString() || v?.toString()) === user.id
      )
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Polls</h1>
          <p className="text-slate-500 mt-1">
            {isSecretariat ? 'View poll results and manage polls' : 'Vote on active polls and view results'}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate(!showCreate)} variant={showCreate ? 'outline' : 'default'}>
            <Plus size={16} className="mr-1" /> {showCreate ? 'Cancel' : 'New Poll'}
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Create form — secretariat and admin */}
      {showCreate && (
        <Card className="mb-6 border-emerald-200">
          <CardHeader><CardTitle className="text-base">Create New Poll</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Question</Label>
              <Input value={newPollQ} onChange={e => setNewPollQ(e.target.value)} placeholder="What do you want to ask?" />
            </div>
            <div className="space-y-2">
              <Label>Options</Label>
              {newPollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={opt} onChange={e => { const u = [...newPollOptions]; u[i] = e.target.value; setNewPollOptions(u); }} placeholder={`Option ${i + 1}`} />
                  {newPollOptions.length > 2 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setNewPollOptions(newPollOptions.filter((_, j) => j !== i))}>✕</Button>
                  )}
                </div>
              ))}
              {newPollOptions.length < 6 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setNewPollOptions([...newPollOptions, ''])}>+ Add option</Button>
              )}
            </div>
            <div className="space-y-1">
              <Label>End date (optional)</Label>
              <Input type="datetime-local" value={newPollEnds} onChange={e => setNewPollEnds(e.target.value)} />
            </div>
            <Button onClick={handleCreate} disabled={creating || !newPollQ || newPollOptions.filter(Boolean).length < 2}>
              {creating ? 'Creating…' : 'Create Poll'}
            </Button>
          </CardContent>
        </Card>
      )}

      {polls.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-slate-400"><Vote size={40} className="mx-auto mb-3 opacity-40" /><p>No polls yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll: any) => {
            const total = getTotal(poll);
            const hasVoted = userHasVoted(poll);
            const myVoteIndex = getMyVoteIndex(poll);
            const isExpired = poll.endsAt && new Date(poll.endsAt) < new Date();

            // Secretariat always sees results. Others see results after voting or when poll is closed.
            const showResults = isSecretariat || hasVoted || !poll.isActive || isExpired;

            return (
              <Card key={poll._id} className={!poll.isActive ? 'opacity-70' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">{poll.question}</CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1"><Users size={12} /> {total} vote{total !== 1 ? 's' : ''}</span>
                        {poll.endsAt && <span>Ends {new Date(poll.endsAt).toLocaleDateString()}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${poll.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {poll.isActive ? 'Active' : 'Closed'}
                        </span>
                      </CardDescription>
                    </div>
                    {canManage && (
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(poll._id)} className="shrink-0 text-xs">
                        {poll.isActive ? 'Close' : 'Reopen'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {poll.options.map((option: any, idx: number) => {
                    const voteCount = option.votes?.length || 0;
                    const pct = total > 0 ? Math.round((voteCount / total) * 100) : 0;
                    const isMyVote = idx === myVoteIndex;

                    if (showResults) {
                      return (
                        <div key={idx} className={`relative rounded-lg overflow-hidden border ${isMyVote ? 'border-emerald-300' : 'border-slate-200'}`}>
                          <div className="absolute inset-0 bg-emerald-50 transition-all" style={{ width: `${pct}%` }} />
                          <div className="relative flex items-center justify-between px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              {isMyVote && <CheckCircle2 size={14} className="text-emerald-600" />}
                              <span className="text-sm font-medium text-slate-800">{option.text}</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-600">{pct}% ({voteCount})</span>
                          </div>
                        </div>
                      );
                    }

                    // Vote buttons — only shown to staff/CM/admin who haven't voted yet
                    return (
                      <button
                        key={idx}
                        onClick={() => handleVote(poll._id, idx)}
                        className="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors text-sm font-medium text-slate-800"
                      >
                        {option.text}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}