import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  FileText, CheckCircle, Clock, AlertTriangle,
  ClipboardList, Eye, MessageSquare, Bell, ArrowLeft, Plus, X
} from 'lucide-react';

const CYCLE_STATUS = ['collecting', 'summarizing', 'reviewing', 'closed'];
const CYCLE_LABELS = { collecting: '서머리 작성중으로', summarizing: '검토중으로', reviewing: '완료로', closed: '(종료됨)' };
const REPORT_STATUS = {
  draft: { label: '작성중', icon: Clock, color: 'text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)]' },
  submitted: { label: '제출 완료', icon: CheckCircle, color: 'text-[var(--color-success)] bg-[var(--color-success-light)]' },
  revision_requested: { label: '수정 요청', icon: AlertTriangle, color: 'text-[var(--color-warning)] bg-[var(--color-warning-light)]' },
};

export default function CycleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState(null);
  const [reports, setReports] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [reminderMsg, setReminderMsg] = useState('보고서 제출 마감이 다가왔습니다. 확인 부탁드립니다.');
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const load = async () => {
    const [c, r, s, p] = await Promise.all([
      api.get(`/cycles/${id}`),
      api.get(`/reports/cycle/${id}`),
      api.get(`/summaries/team/cycle/${id}`),
      api.get(`/cycles/${id}/projects`),
    ]);
    setCycle(c); setReports(r); setSummaries(s); setProjects(p); setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const advanceStatus = async () => {
    const idx = CYCLE_STATUS.indexOf(cycle.status);
    if (idx < CYCLE_STATUS.length - 1) {
      await api.patch(`/cycles/${id}/status`, { status: CYCLE_STATUS[idx + 1] });
      load();
    }
  };

  const viewReport = async (reportId) => {
    const r = await api.get(`/reports/${reportId}`);
    setSelectedReport(r);
  };

  const sendFeedback = async (targetType, targetId, toUserId) => {
    if (!feedbackText.trim()) return;
    await api.post('/feedback', { target_type: targetType, target_id: targetId, to_user_id: toUserId, content: feedbackText });
    setFeedbackText('');
    if (selectedReport) viewReport(selectedReport.id);
  };

  const sendReminder = async () => {
    await api.post('/reminders/send-to-department', { cycle_id: parseInt(id), message: reminderMsg, reminder_type: 'submit' });
    alert('리마인더가 전송되었습니다.');
  };

  // 스태프용 새 프로젝트 추가
  const addProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await api.post('/projects', { name: newProjectName.trim(), description: newProjectDesc.trim() });
    setNewProjectName('');
    setNewProjectDesc('');
    setShowNewProject(false);
    // 프로젝트 목록 갱신
    const p = await api.get(`/cycles/${id}/projects`);
    setProjects(p);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" /></div>;
  if (!cycle) return <div className="text-center py-20 text-[var(--color-text-tertiary)]">사이클을 찾을 수 없습니다.</div>;

  const canAdvance = ['leader', 'strategy', 'executive'].includes(user.role);
  const canCreateReport = user.role === 'staff' && ['collecting', 'open'].includes(cycle.status);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/cycles')} className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-xl transition">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">{cycle.title}</h1>
          <p className="text-[var(--color-text-secondary)] text-xs mt-0.5">{cycle.start_date} — {cycle.end_date}</p>
        </div>
        {canAdvance && cycle.status !== 'closed' && (
          <button onClick={advanceStatus}
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--color-accent-hover)] transition-colors font-medium text-sm">
            다음 단계{CYCLE_LABELS[CYCLE_STATUS[CYCLE_STATUS.indexOf(cycle.status) + 1]] ? `: ${CYCLE_LABELS[CYCLE_STATUS[CYCLE_STATUS.indexOf(cycle.status) + 1]]}` : ''}
          </button>
        )}
      </div>

      <StatusProgress current={cycle.status} />

      {user.role === 'leader' && cycle.status === 'collecting' && (
        <div className="bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[var(--color-warning)] shrink-0" />
            <input value={reminderMsg} onChange={e => setReminderMsg(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-[var(--color-warning)]/20 rounded-lg text-sm" />
            <button onClick={sendReminder} className="px-4 py-2 bg-[var(--color-warning)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition whitespace-nowrap">
              리마인더 전송
            </button>
          </div>
        </div>
      )}

      {/* 현업 담당자: 보고서 작성 */}
      {canCreateReport && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--color-text)] text-sm">내 보고서</h3>
            <button onClick={() => setShowNewProject(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]
                rounded-lg text-xs font-medium hover:bg-[var(--color-border-light)] transition">
              <Plus className="w-3.5 h-3.5" /> 프로젝트 추가
            </button>
          </div>

          {showNewProject && (
            <form onSubmit={addProject} className="mb-4 p-4 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border-light)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text)]">새 프로젝트 추가</span>
                <button type="button" onClick={() => setShowNewProject(false)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">프로젝트명 *</label>
                <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} required
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm"
                  placeholder="예: 고객 포털 리뉴얼" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">설명 (선택)</label>
                <input value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm"
                  placeholder="프로젝트에 대한 간단한 설명" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-3 py-1.5 bg-[var(--color-accent)] text-white rounded-lg text-xs font-medium hover:bg-[var(--color-accent-hover)] transition">추가</button>
                <button type="button" onClick={() => setShowNewProject(false)} className="px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg text-xs font-medium transition">취소</button>
              </div>
            </form>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-tertiary)]">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">담당 프로젝트가 없습니다.</p>
              <p className="text-xs mt-1">위 버튼으로 프로젝트를 추가해보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map(p => {
                const existing = reports.find(r => r.project_id === p.id);
                return (
                  <div key={p.id} className="border border-[var(--color-border-light)] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-[var(--color-text)]">{p.name}</div>
                      {p.description && <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{p.description}</div>}
                      {existing && (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1.5 font-medium ${REPORT_STATUS[existing.status]?.color}`}>
                          {REPORT_STATUS[existing.status]?.label}
                        </span>
                      )}
                    </div>
                    <Link to={existing ? `/reports/${existing.id}/edit?cycle=${id}` : `/reports/new?cycle=${id}&project=${p.id}`}
                      className="ml-3 px-3.5 py-1.5 bg-[var(--color-accent-light)] text-[var(--color-accent)] rounded-lg text-xs font-semibold hover:bg-[var(--color-accent-muted)] transition whitespace-nowrap">
                      {existing ? '수정' : '작성'}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 실장/전략/임원: 제출된 보고서 목록 */}
      {['leader', 'strategy', 'executive'].includes(user.role) && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)] p-6">
          <h3 className="font-semibold text-[var(--color-text)] text-sm mb-4">
            제출된 보고서 ({reports.filter(r => r.status === 'submitted').length}/{reports.length}건)
          </h3>
          {reports.length === 0 ? (
            <p className="text-[var(--color-text-tertiary)] text-sm text-center py-8">제출된 보고서가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {reports.map(r => {
                const st = REPORT_STATUS[r.status] || REPORT_STATUS.draft;
                const StIcon = st.icon;
                return (
                  <div key={r.id}
                    className="flex items-center gap-4 p-3.5 rounded-xl border border-[var(--color-border-light)] hover:bg-[var(--color-surface-hover)] transition cursor-pointer"
                    onClick={() => viewReport(r.id)}>
                    <StIcon className={`w-4 h-4 ${st.color.split(' ')[0]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[var(--color-text)]">{r.project_name}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">{r.submitted_by_name} · {r.department_name}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>{st.label}</span>
                    <Eye className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedReport && (
        <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)}
          user={user} feedbackText={feedbackText} setFeedbackText={setFeedbackText}
          onSendFeedback={sendFeedback} />
      )}

      {['strategy', 'executive'].includes(user.role) && summaries.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)] p-6">
          <h3 className="font-semibold text-[var(--color-text)] text-sm mb-4">팀 서머리</h3>
          <div className="space-y-3">
            {summaries.map(s => (
              <div key={s.id} className="p-4 rounded-xl border border-[var(--color-border-light)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[var(--color-text)] text-sm">{s.department_name}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.status === 'submitted' ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'}`}>
                    {s.status === 'submitted' ? '제출 완료' : '작성중'}
                  </span>
                </div>
                {s.summary_content && <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{s.summary_content}</p>}
                {s.key_points && (
                  <div className="mt-2 p-3 bg-[var(--color-info-light)] rounded-lg">
                    <div className="text-xs font-semibold text-[var(--color-info)] mb-1">핵심 포인트</div>
                    <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{s.key_points}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {user.role === 'leader' && (
          <Link to={`/summary/${id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition font-medium text-sm">
            <ClipboardList className="w-4 h-4" /> 팀 서머리 작성
          </Link>
        )}
        {user.role === 'strategy' && (
          <Link to={`/executive/${id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--color-accent-hover)] transition font-medium text-sm">
            <FileText className="w-4 h-4" /> 임원 보고서 작성
          </Link>
        )}
      </div>
    </div>
  );
}

function StatusProgress({ current }) {
  const steps = [
    { key: 'collecting', label: '보고서 취합' },
    { key: 'summarizing', label: '서머리 작성' },
    { key: 'reviewing', label: '임원 검토' },
    { key: 'closed', label: '완료' },
  ];
  const currentIdx = steps.findIndex(s => s.key === current);
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-light)] p-4">
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                ${i <= currentIdx ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]'}`}>
                {i < currentIdx ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap hidden sm:block ${i <= currentIdx ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${i < currentIdx ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportModal({ report, onClose, user, feedbackText, setFeedbackText, onSendFeedback }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--color-surface)] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--color-text)]">{report.project_name}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] text-lg transition">&times;</button>
        </div>
        <div className="text-sm text-[var(--color-text-secondary)] mb-3">{report.submitted_by_name} · {report.department_name}</div>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 bg-[var(--color-surface-secondary)] rounded-full h-2">
            <div className="bg-[var(--color-accent)] h-2 rounded-full" style={{ width: `${report.progress_percent}%` }} />
          </div>
          <span className="text-sm font-semibold text-[var(--color-accent)]">{report.progress_percent}%</span>
        </div>
        <Section title="주요 진행 내용" content={report.content} />
        <Section title="주요 성과" content={report.key_achievements} />
        <Section title="이슈 / 리스크" content={report.issues} />
        <Section title="다음 주 계획" content={report.next_plans} />

        {report.feedbacks?.length > 0 && (
          <div className="mt-5 border-t border-[var(--color-border-light)] pt-4">
            <h4 className="font-semibold text-xs text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">피드백 이력</h4>
            {report.feedbacks.map(fb => (
              <div key={fb.id} className="p-3 bg-[var(--color-surface-secondary)] rounded-xl mb-2">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] mb-1">
                  <span className="font-medium text-[var(--color-text-secondary)]">{fb.from_user_name}</span>
                  <span>{new Date(fb.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">{fb.content}</p>
              </div>
            ))}
          </div>
        )}
        {['leader', 'executive'].includes(user.role) && (
          <div className="mt-5 border-t border-[var(--color-border-light)] pt-4">
            <h4 className="font-semibold text-xs text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">피드백 작성</h4>
            <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={3}
              className="w-full px-3.5 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl text-sm" placeholder="피드백을 입력하세요..." />
            <button onClick={() => onSendFeedback('report', report.id, report.submitted_by)}
              className="mt-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-accent-hover)] transition">
              피드백 전송
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, content }) {
  if (!content) return null;
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wide">{title}</h4>
      <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap bg-[var(--color-surface-secondary)] p-3.5 rounded-xl leading-relaxed">{content}</p>
    </div>
  );
}
