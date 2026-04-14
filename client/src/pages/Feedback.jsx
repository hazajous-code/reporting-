import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { MessageSquare, Inbox, Send, Check, CheckCheck } from 'lucide-react';

export default function Feedback() {
  const { user } = useAuth();
  const [tab, setTab] = useState('received');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [r, s] = await Promise.all([api.get('/feedback/received'), api.get('/feedback/sent')]);
    setReceived(r); setSent(s); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.patch(`/feedback/${id}/read`, {});
    setReceived(prev => prev.map(f => f.id === id ? { ...f, is_read: true } : f));
  };
  const markAllRead = async () => {
    await api.post('/feedback/mark-all-read', {});
    setReceived(prev => prev.map(f => ({ ...f, is_read: true })));
  };

  const unreadCount = received.filter(f => !f.is_read).length;
  const items = tab === 'received' ? received : sent;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">피드백</h1>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm">피드백을 확인하고 관리합니다.</p>
        </div>
        {tab === 'received' && unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-accent-muted)] transition">
            <CheckCheck className="w-4 h-4" /> 전체 읽음 처리
          </button>
        )}
      </div>

      <div className="flex gap-1 p-1 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-xl w-fit">
        <TabBtn active={tab === 'received'} onClick={() => setTab('received')} icon={Inbox} label="받은 피드백" badge={unreadCount} />
        <TabBtn active={tab === 'sent'} onClick={() => setTab('sent')} icon={Send} label="보낸 피드백" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-tertiary)]">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{tab === 'received' ? '받은 피드백이 없습니다.' : '보낸 피드백이 없습니다.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(fb => (
            <div key={fb.id}
              className={`bg-[var(--color-surface)] rounded-xl border p-4 transition-all duration-200
                ${tab === 'received' && !fb.is_read ? 'border-[var(--color-accent-muted)] shadow-sm' : 'border-[var(--color-border-light)]'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    {tab === 'received' ? (
                      <span className="font-semibold text-sm text-[var(--color-text)]">{fb.from_user_name}</span>
                    ) : (
                      <span className="font-semibold text-sm text-[var(--color-text)]">→ {fb.to_user_name}</span>
                    )}
                    <span className="text-xs text-[var(--color-text-tertiary)]">{new Date(fb.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    {fb.target_type === 'report' && (
                      <span className="text-xs px-2 py-0.5 bg-[var(--color-info-light)] text-[var(--color-info)] rounded-full font-medium">보고서</span>
                    )}
                    {fb.target_type === 'team_summary' && (
                      <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full font-medium">팀 서머리</span>
                    )}
                    {fb.target_type === 'executive_report' && (
                      <span className="text-xs px-2 py-0.5 bg-[var(--color-warning-light)] text-[var(--color-warning)] rounded-full font-medium">임원 보고서</span>
                    )}
                    {tab === 'received' && !fb.is_read && (
                      <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{fb.content}</p>
                </div>
                {tab === 'received' && !fb.is_read && (
                  <button onClick={() => markRead(fb.id)}
                    className="shrink-0 p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-success)] hover:bg-[var(--color-success-light)] rounded-lg transition" title="읽음 처리">
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label, badge }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
        ${active ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-secondary)]'}`}>
      <Icon className="w-4 h-4" />
      {label}
      {badge > 0 && <span className="w-5 h-5 bg-[var(--color-accent)] text-white text-xs font-bold rounded-full flex items-center justify-center">{badge}</span>}
    </button>
  );
}
