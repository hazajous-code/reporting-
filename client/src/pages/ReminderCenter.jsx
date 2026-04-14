import { useState, useEffect } from 'react';
import { api } from '../api';
import { Bell, Check } from 'lucide-react';

const TYPE_MAP = {
  submit: { label: 'Report Due', color: 'bg-[var(--color-info-light)] text-[var(--color-info)]' },
  summarize: { label: 'Summary Due', color: 'bg-violet-50 text-violet-700' },
  review: { label: 'Review Needed', color: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]' },
};

export default function ReminderCenter() {
  const [reminders, setReminders] = useState([]);

  useEffect(() => { api.get('/reminders').then(setReminders); }, []);

  const markRead = async (id) => {
    await api.patch(`/reminders/${id}/read`);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, is_read: 1 } : r));
  };

  const markAllRead = async () => {
    await api.patch('/reminders/read-all');
    setReminders(prev => prev.map(r => ({ ...r, is_read: 1 })));
  };

  const unread = reminders.filter(r => !r.is_read).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">Notifications</h1>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm">Stay on top of reminders and alerts.</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-border-light)] transition text-sm font-medium">
            <Check className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {reminders.map(r => {
          const type = TYPE_MAP[r.reminder_type] || TYPE_MAP.submit;
          return (
            <div key={r.id}
              className={`bg-[var(--color-surface)] rounded-xl border p-5 cursor-pointer transition-all duration-150
                ${!r.is_read ? 'border-[var(--color-accent-muted)]' : 'border-[var(--color-border-light)]'}`}
              onClick={() => !r.is_read && markRead(r.id)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {!r.is_read && <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full" />}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${type.color}`}>{type.label}</span>
                  <span className="text-sm font-medium text-[var(--color-text)]">{r.cycle_title}</span>
                </div>
                <span className="text-xs text-[var(--color-text-tertiary)]">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{r.message}</p>
            </div>
          );
        })}
        {reminders.length === 0 && (
          <div className="text-center py-20 text-[var(--color-text-tertiary)]">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
