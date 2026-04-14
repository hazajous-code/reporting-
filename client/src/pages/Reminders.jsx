import { useState, useEffect } from 'react';
import { api } from '../api';
import { Bell, Check, CheckCheck } from 'lucide-react';

const TYPE_LABELS = {
  submit: '제출 요청',
  revision: '수정 요청',
  announcement: '공지사항',
};

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await api.get('/reminders');
    setReminders(r); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.patch(`/reminders/${id}/read`, {});
    setReminders(prev => prev.map(r => r.id === id ? { ...r, is_read: true } : r));
  };

  const markAllRead = async () => {
    await api.post('/reminders/mark-all-read', {});
    setReminders(prev => prev.map(r => ({ ...r, is_read: true })));
  };

  const unreadCount = reminders.filter(r => !r.is_read).length;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">알림</h1>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm">보고서 제출 요청 및 각종 알림을 확인합니다.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-accent-muted)] transition">
            <CheckCheck className="w-4 h-4" /> 전체 읽음 처리
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" /></div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-tertiary)]">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">알림이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map(r => (
            <div key={r.id}
              className={`bg-[var(--color-surface)] rounded-xl border p-4 transition-all duration-200
                ${!r.is_read ? 'border-[var(--color-accent-muted)] shadow-sm' : 'border-[var(--color-border-light)]'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${!r.is_read ? 'bg-[var(--color-accent-light)]' : 'bg-[var(--color-surface-secondary)]'}`}>
                    <Bell className={`w-4 h-4 ${!r.is_read ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm text-[var(--color-text)]">{r.sent_by_name}</span>
                      <span className="text-xs px-2 py-0.5 bg-[var(--color-info-light)] text-[var(--color-info)] rounded-full font-medium">
                        {TYPE_LABELS[r.reminder_type] || r.reminder_type}
                      </span>
                      {!r.is_read && <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full" />}
                    </div>
                    <p className="text-sm text-[var(--color-text)] leading-relaxed">{r.message}</p>
                    <span className="text-xs text-[var(--color-text-tertiary)] mt-1 block">
                      {new Date(r.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                {!r.is_read && (
                  <button onClick={() => markRead(r.id)}
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
