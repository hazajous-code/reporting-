import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { ArrowLeft, Save, Send, ClipboardList, MessageSquare } from 'lucide-react';

export default function ExecutiveReport() {
  const { cycleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState([]);
  const [execReport, setExecReport] = useState(null);
  const [form, setForm] = useState({ overall_summary: '', highlights: '', risks_and_issues: '', decisions_needed: '' });
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cycle, setCycle] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/cycles/${cycleId}`),
      api.get(`/summaries/team/cycle/${cycleId}`),
      api.get(`/summaries/executive/cycle/${cycleId}`),
    ]).then(([c, s, e]) => {
      setCycle(c); setSummaries(s); setExecReport(e);
      if (e) setForm({ overall_summary: e.overall_summary || '', highlights: e.highlights || '', risks_and_issues: e.risks_and_issues || '', decisions_needed: e.decisions_needed || '' });
    });
  }, [cycleId]);

  const handleSave = async (status) => {
    setSaving(true);
    try {
      await api.post('/summaries/executive', { cycle_id: parseInt(cycleId), ...form, status });
      navigate(`/cycles/${cycleId}`);
    } finally { setSaving(false); }
  };

  const sendSummaryFeedback = async (summary) => {
    if (!feedbackText.trim()) return;
    await api.post('/feedback', { target_type: 'team_summary', target_id: summary.id, to_user_id: summary.summarized_by, content: feedbackText });
    setFeedbackText(''); setFeedbackTarget(null);
  };

  const sendExecFeedback = async () => {
    if (!feedbackText.trim() || !execReport) return;
    await api.post('/feedback', { target_type: 'executive_report', target_id: execReport.id, to_user_id: execReport.prepared_by, content: feedbackText });
    setFeedbackText('');
    const refreshed = await api.get(`/summaries/executive/cycle/${cycleId}`);
    setExecReport(refreshed);
  };

  const isStrategy = user.role === 'strategy';
  const isExec = user.role === 'executive';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-xl transition">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">
            {isExec ? '임원 보고서 검토' : '임원 보고서 작성'}
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{cycle?.title}</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)] p-6">
        <h3 className="font-semibold text-[var(--color-text)] text-sm mb-3 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-violet-600" />
          팀 서머리 ({summaries.filter(s => s.status === 'submitted').length}/{summaries.length}건 제출)
        </h3>
        <div className="space-y-3">
          {summaries.map(s => (
            <div key={s.id} className="p-4 border border-[var(--color-border-light)] rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[var(--color-text)] text-sm">{s.department_name}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === 'submitted' ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'}`}>
                    {s.status === 'submitted' ? '제출 완료' : '작성중'}
                  </span>
                  {(isStrategy || isExec) && (
                    <button onClick={() => { setFeedbackTarget(s); setFeedbackText(''); }}
                      className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition" title="피드백 작성">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{s.summary_content}</p>
              {s.key_points && (
                <div className="mt-2 p-2.5 bg-[var(--color-info-light)] rounded-lg text-xs text-[var(--color-text-secondary)]">
                  <span className="font-semibold text-[var(--color-info)]">핵심 포인트:</span> {s.key_points}
                </div>
              )}
              {s.risk_items && (
                <div className="mt-1.5 p-2.5 bg-[var(--color-danger-light)] rounded-lg text-xs text-[var(--color-text-secondary)]">
                  <span className="font-semibold text-[var(--color-danger)]">리스크:</span> {s.risk_items}
                </div>
              )}
              {feedbackTarget?.id === s.id && (
                <div className="mt-3 p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl">
                  <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={2}
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm" placeholder="피드백을 입력하세요..." />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => sendSummaryFeedback(s)} className="px-3 py-1.5 bg-[var(--color-accent)] text-white rounded-lg text-xs font-medium hover:bg-[var(--color-accent-hover)] transition">전송</button>
                    <button onClick={() => setFeedbackTarget(null)} className="px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg text-xs font-medium transition">취소</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {summaries.length === 0 && <p className="text-[var(--color-text-tertiary)] text-sm text-center py-6">제출된 팀 서머리가 없습니다.</p>}
        </div>
      </div>

      {isStrategy && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)] p-6 space-y-5">
          <h3 className="font-semibold text-[var(--color-text)] text-sm">임원 보고서 작성</h3>
          <Field label="전체 요약 *" value={form.overall_summary} onChange={v => setForm(f => ({ ...f, overall_summary: v }))} rows={5} placeholder="임원에게 보고할 전체 요약을 작성해주세요." />
          <Field label="주요 하이라이트" value={form.highlights} onChange={v => setForm(f => ({ ...f, highlights: v }))} rows={3} placeholder="주요 성과 및 하이라이트를 작성해주세요." />
          <Field label="리스크 및 이슈" value={form.risks_and_issues} onChange={v => setForm(f => ({ ...f, risks_and_issues: v }))} rows={3} placeholder="주의가 필요한 리스크 및 이슈를 정리해주세요." />
          <Field label="의사결정 필요 사항" value={form.decisions_needed} onChange={v => setForm(f => ({ ...f, decisions_needed: v }))} rows={3} placeholder="임원의 의사결정이 필요한 사항을 정리해주세요." />
          <div className="flex gap-3 pt-2">
            <button onClick={() => handleSave('draft')} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-border-light)] transition font-medium text-sm disabled:opacity-50">
              <Save className="w-4 h-4" /> 임시 저장
            </button>
            <button onClick={() => handleSave('submitted')} disabled={saving || !form.overall_summary.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--color-accent-hover)] transition font-medium text-sm disabled:opacity-50">
              <Send className="w-4 h-4" /> 임원에게 보고
            </button>
          </div>
        </div>
      )}

      {isExec && execReport && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)] p-6 space-y-4">
          <h3 className="font-semibold text-[var(--color-text)] text-sm">임원 보고서</h3>
          <Section title="전체 요약" content={execReport.overall_summary} />
          <Section title="주요 하이라이트" content={execReport.highlights} />
          <Section title="리스크 및 이슈" content={execReport.risks_and_issues} />
          <Section title="의사결정 필요 사항" content={execReport.decisions_needed} />
          {execReport.feedbacks?.length > 0 && (
            <div className="border-t border-[var(--color-border-light)] pt-4">
              <h4 className="font-semibold text-xs text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">피드백 이력</h4>
              {execReport.feedbacks.map(fb => (
                <div key={fb.id} className="p-3 bg-[var(--color-surface-secondary)] rounded-xl mb-2">
                  <div className="text-xs text-[var(--color-text-tertiary)] mb-1">
                    <span className="font-medium text-[var(--color-text-secondary)]">{fb.from_user_name}</span>
                    <span className="ml-2">{new Date(fb.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">{fb.content}</p>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-[var(--color-border-light)] pt-4">
            <h4 className="font-semibold text-xs text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">피드백 작성</h4>
            <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={3}
              className="w-full px-3.5 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl text-sm" placeholder="전략기획팀에 전달할 피드백을 작성해주세요..." />
            <button onClick={sendExecFeedback} disabled={!feedbackText.trim()}
              className="mt-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-accent-hover)] transition disabled:opacity-50">
              피드백 전송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, content }) {
  if (!content) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wide">{title}</h4>
      <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap bg-[var(--color-surface-secondary)] p-3.5 rounded-xl leading-relaxed">{content}</p>
    </div>
  );
}

function Field({ label, value, onChange, rows, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        className="w-full px-4 py-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] leading-relaxed" placeholder={placeholder} />
    </div>
  );
}
