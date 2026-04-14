import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { CalendarRange, Plus, ChevronRight } from 'lucide-react';

const STATUS = {
  open: '오픈', collecting: '취합중', summarizing: '서머리 작성중',
  reviewing: '검토중', closed: '완료',
};
const FREQ = { weekly: '주간', biweekly: '격주' };

export default function CycleList() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', start_date: '', end_date: '', frequency: 'weekly' });

  useEffect(() => { api.get('/cycles').then(setCycles); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const cycle = await api.post('/cycles', form);
    setCycles(prev => [cycle, ...prev]);
    setShowCreate(false);
    setForm({ title: '', start_date: '', end_date: '', frequency: 'weekly' });
  };

  const canCreate = ['leader', 'strategy', 'executive'].includes(user?.role);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">보고 사이클</h1>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm">주간/격주 보고 사이클을 관리합니다.</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--color-accent-hover)] transition-colors font-medium text-sm shadow-sm">
            <Plus className="w-4 h-4" /> 새 사이클
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)] p-6 space-y-4">
          <h3 className="font-semibold text-[var(--color-text)]">새 보고 사이클 생성</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">제목</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                className="w-full px-3.5 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl text-sm" placeholder="예: 4월 2주차 주간보고" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">주기</label>
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl text-sm">
                <option value="weekly">주간</option>
                <option value="biweekly">격주</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">시작일</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required
                className="w-full px-3.5 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">마감일</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required
                className="w-full px-3.5 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl text-sm" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" className="px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--color-accent-hover)] transition-colors font-medium text-sm">생성</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-border-light)] transition-colors font-medium text-sm">취소</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {cycles.map(cycle => (
          <Link key={cycle.id} to={`/cycles/${cycle.id}`}
            className="group block bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-light)] p-5 hover:border-[var(--color-accent-muted)] hover:shadow-sm transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[var(--color-surface-secondary)] rounded-xl">
                  <CalendarRange className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text)] text-sm">{cycle.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-text-secondary)]">
                    <span>{cycle.start_date} — {cycle.end_date}</span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span>{FREQ[cycle.frequency]}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cycle.status === 'closed' ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' : 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'}`}>
                  {STATUS[cycle.status]}
                </span>
                <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)] transition-colors" />
              </div>
            </div>
          </Link>
        ))}
        {cycles.length === 0 && (
          <div className="text-center py-16 text-[var(--color-text-tertiary)]">
            <CalendarRange className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">아직 생성된 보고 사이클이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
