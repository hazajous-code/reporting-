import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { ArrowLeft, Save, Send, FileText } from 'lucide-react';

export default function TeamSummary() {
  const { cycleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({ summary_content: '', key_points: '', risk_items: '' });
  const [saving, setSaving] = useState(false);
  const [cycle, setCycle] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/cycles/${cycleId}`),
      api.get(`/reports/cycle/${cycleId}`),
      api.get(`/summaries/team/cycle/${cycleId}`),
    ]).then(([c, r, s]) => {
      setCycle(c); setReports(r);
      const mine = s.find(x => x.department_id === user.department_id);
      if (mine) setForm({ summary_content: mine.summary_content || '', key_points: mine.key_points || '', risk_items: mine.risk_items || '' });
    });
  }, [cycleId]);

  const submittedReports = reports.filter(r => r.status === 'submitted');

  const handleSave = async (status) => {
    setSaving(true);
    try {
      await api.post('/summaries/team', { cycle_id: parseInt(cycleId), ...form, status });
      navigate(`/cycles/${cycleId}`);
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-xl transition">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">팀 서머리 작성</h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{cycle?.title} · {user.department_name}</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)] p-6">
        <h3 className="font-semibold text-[var(--color-text)] text-sm mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--color-accent)]" />
          제출된 보고서 ({submittedReports.length}건)
        </h3>
        {submittedReports.length === 0 ? (
          <p className="text-[var(--color-text-tertiary)] text-sm py-6 text-center">제출된 보고서가 없습니다.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {submittedReports.map(r => (
              <div key={r.id} className="p-4 border border-[var(--color-border-light)] rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-[var(--color-text)] text-sm">{r.project_name}</span>
                    <span className="text-xs text-[var(--color-text-secondary)] ml-2">{r.submitted_by_name}</span>
                  </div>
                  <span className="text-xs text-[var(--color-accent)] font-semibold">{r.progress_percent}%</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{r.content}</p>
                {r.issues && (
                  <div className="mt-2 p-2.5 bg-[var(--color-warning-light)] rounded-lg text-xs text-[var(--color-warning)]">
                    <span className="font-semibold">이슈:</span> {r.issues}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)] p-6 space-y-5">
        <h3 className="font-semibold text-[var(--color-text)] text-sm">서머리 작성</h3>
        <Field label="종합 요약 *" value={form.summary_content} onChange={v => setForm(f => ({ ...f, summary_content: v }))} rows={5}
          placeholder="팀 전체의 이번 주 진행상황을 종합적으로 요약해주세요." />
        <Field label="핵심 포인트" value={form.key_points} onChange={v => setForm(f => ({ ...f, key_points: v }))} rows={3}
          placeholder="보고에서 강조할 핵심 포인트를 작성해주세요." />
        <Field label="리스크 항목" value={form.risk_items} onChange={v => setForm(f => ({ ...f, risk_items: v }))} rows={3}
          placeholder="주의가 필요한 리스크 항목을 작성해주세요." />
        <div className="flex gap-3 pt-2">
          <button onClick={() => handleSave('draft')} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-border-light)] transition font-medium text-sm disabled:opacity-50">
            <Save className="w-4 h-4" /> 임시 저장
          </button>
          <button onClick={() => handleSave('submitted')} disabled={saving || !form.summary_content.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition font-medium text-sm disabled:opacity-50">
            <Send className="w-4 h-4" /> 전략기획팀에 제출
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, rows, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        className="w-full px-4 py-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] leading-relaxed"
        placeholder={placeholder} />
    </div>
  );
}
