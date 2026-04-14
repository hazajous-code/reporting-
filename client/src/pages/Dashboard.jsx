import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { FileText, MessageSquare, Bell, ArrowRight, CalendarRange, ClipboardList, Send } from 'lucide-react';

const STATUS_LABELS = {
  open: '오픈', collecting: '취합중', summarizing: '서머리 작성중',
  reviewing: '검토중', closed: '완료',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const { activeCycle, unreadFeedback, unreadReminders, stats, recentFeedback } = data;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">안녕하세요, {user.name}님</h1>
        <p className="text-[var(--color-text-secondary)] mt-1 text-sm">{user.department_name || '경영진'}</p>
      </div>

      {activeCycle && (
        <Link to={`/cycles/${activeCycle.id}`}
          className="group block bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)]
            p-6 hover:border-[var(--color-accent-muted)] hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-xs font-medium mb-2">
                <CalendarRange className="w-3.5 h-3.5" />
                현재 진행중인 보고 사이클
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{activeCycle.title}</h2>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">{activeCycle.start_date} — {activeCycle.end_date}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-[var(--color-accent-light)] text-[var(--color-accent)] rounded-full text-xs font-semibold">
                {STATUS_LABELS[activeCycle.status]}
              </span>
              <ArrowRight className="w-5 h-5 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)] transition-colors" />
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={MessageSquare} label="미확인 피드백" value={unreadFeedback} link="/feedback" />
        <StatCard icon={Bell} label="미확인 알림" value={unreadReminders} link="/reminders" />
        {user.role === 'staff' && stats.myReports != null && (
          <StatCard icon={FileText} label="제출한 보고서" value={`${stats.myReports?.submitted || 0} / ${stats.myProjects || 0}`} />
        )}
        {user.role === 'leader' && stats.teamReports && (
          <StatCard icon={ClipboardList} label="팀 보고서 제출" value={`${stats.teamReports.submitted || 0} / ${stats.teamReports.total || 0}`} />
        )}
        {user.role === 'strategy' && (
          <StatCard icon={ClipboardList} label="서머리 수집 현황" value={`${stats.allSummaries?.filter(s => s.status === 'submitted').length || 0} / ${stats.totalDepartments || 0}`} />
        )}
        {user.role === 'executive' && (
          <StatCard icon={FileText} label="임원 보고서" value={stats.executiveReport ? (stats.executiveReport.status === 'submitted' ? '검토 대기' : '작성 중') : '미작성'} />
        )}
      </div>

      {user.role === 'staff' && activeCycle && (
        <ActionCard to={`/cycles/${activeCycle.id}`} icon={Send} iconBg="bg-emerald-600"
          title="주간 보고서 작성하기" desc="이번 주 프로젝트 진행 내용을 보고합니다." />
      )}
      {user.role === 'leader' && activeCycle && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard to={`/cycles/${activeCycle.id}`} icon={FileText} iconBg="bg-[var(--color-info)]"
            title="팀 보고서 확인" desc="현업 담당자들이 제출한 보고서를 확인합니다." />
          <ActionCard to={`/summary/${activeCycle.id}`} icon={ClipboardList} iconBg="bg-violet-600"
            title="팀 서머리 작성" desc="보고서 내용을 정리하여 핵심 서머리를 작성합니다." />
        </div>
      )}
      {user.role === 'strategy' && activeCycle && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard to={`/cycles/${activeCycle.id}`} icon={ClipboardList} iconBg="bg-[var(--color-info)]"
            title="팀 서머리 확인" desc="각 사업실에서 제출한 서머리를 확인합니다." />
          <ActionCard to={`/executive/${activeCycle.id}`} icon={FileText} iconBg="bg-[var(--color-warning)]"
            title="임원 보고서 작성" desc="팀 서머리를 취합하여 임원 보고서를 작성합니다." />
        </div>
      )}

      {recentFeedback.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--color-text)] text-sm">최근 피드백</h3>
            <Link to="/feedback" className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium">전체보기</Link>
          </div>
          <div className="space-y-3">
            {recentFeedback.map(fb => (
              <div key={fb.id} className={`p-3.5 rounded-xl border ${fb.is_read ? 'border-[var(--color-border-light)]' : 'border-[var(--color-accent-muted)] bg-[var(--color-accent-light)]'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-[var(--color-text)]">{fb.from_user_name}</span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">{new Date(fb.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                  {!fb.is_read && <span className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full" />}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{fb.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, link }) {
  const content = (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-light)] p-5 hover:border-[var(--color-accent-muted)] hover:shadow-sm transition-all duration-200">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-[var(--color-surface-secondary)]">
          <Icon className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </div>
        <div>
          <div className="text-xs text-[var(--color-text-secondary)] font-medium">{label}</div>
          <div className="text-xl font-bold text-[var(--color-text)] mt-0.5">{value}</div>
        </div>
      </div>
    </div>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}

function ActionCard({ to, icon: Icon, iconBg, title, desc }) {
  return (
    <Link to={to}
      className="group block bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-light)] p-5 hover:border-[var(--color-accent-muted)] hover:shadow-sm transition-all duration-200">
      <div className="flex items-center gap-3.5 mb-2">
        <div className={`p-2 ${iconBg} rounded-lg`}><Icon className="w-4 h-4 text-white" /></div>
        <h3 className="font-semibold text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">{title}</h3>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] pl-[46px]">{desc}</p>
    </Link>
  );
}
