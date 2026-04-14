import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { ArrowLeft, Save, Send } from 'lucide-react';

export default function ReportForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const cycleId = searchParams.get('cycle');
  const projectId = searchParams.get('project');
  const isEdit = !!id;

  const [form, setForm] = useState({ content: '', key_achievements: '', issues: '', next_plans: '', progress_percent: 0 });
  const [project, setProject] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/reports/${id}`).then(r => {
        setForm({ content: r.content || '', key_achievements: r.key_achievements || '', issues: r.issues || '', next_plans: r.next_plans || '', progress_percent: r.progress_percent || 0 });
        setProject({ name: r.project_name, department_name: r.department_name });
      });
    }
  }, [id]);

  const handleSave = async (status) => {
    setSaving(true);
    try {
      if (isEdit) await api.put(`/reports/${id}`, { ...form, status });
      else await api.post('/reports', { cycle_id: parseInt(cycleId), project_id: parseInt(projectId), ...form, status });
      navigate(`/cycles/${cycleId}`);
    } finally { setSaving(false); }
  };

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-xl transition">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">{isEdit ? '보고서 수정' : '보고서 작성'}</h1>
          {project && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{project.name} · {project.department_name}</p>}
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)] p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">진행률</label>
          <div className="flex items-center gap-4">
            <input type="range" min="0" max="100" value={form.progress_percent}
              onChange={e => update('progress_percent', parseInt(e.target.value))}
              className="flex-1 accent-[var(--color-accent)]" />
            <span className="text-lg font-bold text-[var(--color-accent)] w-14 text-right">{form.progress_percent}%</span>
          </div>
        </div>

        <Field label="주요 진행 내용 *" value={form.content} onChange={v => update('content', v)} rows={5}
          placeholder="이번 주 주요 진행 사항을 상세히 작성해주세요." />
        <Field label="주요 성과" value={form.key_achievements} onChange={v => update('key_achievements', v)} rows={3}
          placeholder="이번 주 달성한 주요 성과를 작성해주세요." />
        <Field label="이슈 / 리스크" value={form.issues} onChange={v => update('issues', v)} rows={3}
          placeholder="현재 이슈사항이나 리스크를 작성해주세요." />
        <Field label="다음 주 계획" value={form.next_plans} onChange={v => update('next_plans', v)} rows={3}
          placeholder="다음 주 진행 예정 사항을 작성해주세요." />

        <div className="flex gap-3 pt-2">
          <button onClick={() => handleSave('draft')} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-border-light)] transition font-medium text-sm disabled:opacity-50">
            <Save className="w-4 h-4" /> 임시 저장
          </button>
          <button onClick={() => handleSave('submitted')} disabled={saving || !form.content.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--color-accent-hover)] transition font-medium text-sm disabled:opacity-50">
            <Send className="w-4 h-4" /> 제출하기
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
