import { useState, useEffect } from 'react';
import { api } from '../api';
import { MessageSquare, Inbox, Send, Check } from 'lucide-react';

const ROLE_KR = { staff: 'Staff', leader: 'Team Lead', strategy: 'Strategy', executive: 'Executive' };

export default function FeedbackCenter() {
  const [tab, setTab] = useState('received');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);

  const load = () => {
    api.get('/feedback/received').then(setReceived);
    api.get('/feedback/sent').then(setSent);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.patch(`/feedback/${id}/read`);
    setReceived(prev => prev.map(f => f.id === id ? { ...f, is_read: 1 } : f));
  };

  const markAllRead = async () => {
    await api.patch('/feedback/read-all');
    setReceived(prev => prev.map(f => ({ ...f, is_read: 1 })));
  };

  const unreadCount = received.filter(f => !f.is_read).length;
  const items = tab === 'received' ? received : sent;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">Feedback</h1>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm">Review feedback you've received and sent.</p>
        </div>
        {tab === 'received' && unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-border-light)] transition text-sm font-medium">
            <Check className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <TabBtn active={tab === 'received'} onClick={() => setTab('received')} icon={Inbox} label="Received" badge={unreadCount} />
        <TabBtn active={tab === 'sent'} onClick={() => setTab('sent')} icon={Send} label="Sent" />
      </div>

      <div className="space-y-3">
        {items.map(fb => (
          <div key={fb.id}
            className={`bg-[var(--color-surface)] rounded-xl border p-5 transition-all duration-150 cursor-pointer
              ${!fb.is_read && tab === 'received' ? 'border-[var(--color-accent-muted)]' : 'border-[var(--color-border-light)]'}`}
            onClick={() => tab === 'received' && !fb.is_read && markRead(fb.id)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {!fb.is_read && tab === 'received' && <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full" />}
                <span className="font-medium text-[var(--color-text)] text-sm">
                  {tab === 'received' ? fb.from_user_name : fb.to_user_name}
                </span>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {tab === 'received' && fb.from_user_role ? `(${ROLE_KR[fb.from_user_role]})` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {fb.target_name && <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] px-2.5 py-1 rounded-lg">{fb.target_name}</span>}
                <span className="text-xs text-[var(--color-text-tertiary)]">{new Date(fb.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{fb.content}</p>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-20 text-[var(--color-text-tertiary)]">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{tab === 'received' ? 'No feedback received yet.' : 'No feedback sent yet.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label, badge }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
        ${active ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-light)] hover:bg-[var(--color-surface-secondary)]'}`}>
      <Icon className="w-4 h-4" /> {label}
      {badge > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${active ? 'bg-white/20' : 'bg-[var(--color-danger)] text-white'}`}>{badge}</span>}
    </button>
  );
}
