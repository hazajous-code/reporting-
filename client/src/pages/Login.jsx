import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, ChevronDown, FileText, Users, ClipboardCheck, MessageCircle } from 'lucide-react';

const ROLES = [
  {
    key: 'staff',
    label: '현업 담당자',
    name: 'John Kim',
    email: 'staff1@test.com',
    dept: 'Digital Business',
    desc: '프로젝트 주간 진행 보고서 작성',
    color: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-500',
    icon: FileText,
  },
  {
    key: 'leader',
    label: '실장',
    name: 'David Oh',
    email: 'leader1@test.com',
    dept: 'Digital Business',
    desc: '보고서 취합 및 팀 서머리 작성',
    color: 'from-[#C4653A] to-[#A8512D]',
    iconBg: 'bg-[#C4653A]',
    icon: ClipboardCheck,
  },
  {
    key: 'strategy',
    label: '전략기획팀',
    name: 'Rachel Lim',
    email: 'strategy@test.com',
    dept: '전략기획팀',
    desc: '팀 서머리 취합 및 임원 보고서 작성',
    color: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-600',
    icon: Users,
  },
  {
    key: 'executive',
    label: '임원',
    name: 'Andrew Choi',
    email: 'exec@test.com',
    dept: 'C-Level',
    desc: '임원 보고서 검토 및 피드백',
    color: 'from-gray-700 to-gray-900',
    iconBg: 'bg-gray-800',
    icon: MessageCircle,
  },
];

const FLOW_STEPS = [
  { num: '1', text: '현업 보고서 작성' },
  { num: '2', text: '실장 서머리 작성' },
  { num: '3', text: '전략기획팀 취합' },
  { num: '4', text: '임원 검토 및 피드백' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  if (user) return <Navigate to="/" />;

  const enter = async (role) => {
    setError('');
    setLoading(role.key);
    try {
      await login(role.email, '1234');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    setManualLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C4653A]/5 via-transparent to-violet-500/5" />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#C4653A] to-[#A8512D] rounded-2xl mb-6 shadow-lg shadow-[#C4653A]/20">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-text)] tracking-tight">WeeklyFlow</h1>
          <p className="text-lg text-[var(--color-text-secondary)] mt-3 max-w-xl mx-auto leading-relaxed">
            현업부터 임원까지, 주간보고를 한 곳에서 관리하세요.
          </p>

          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-full">
                  <span className="w-5 h-5 bg-[var(--color-accent-light)] text-[var(--color-accent)] rounded-full text-xs font-bold flex items-center justify-center">{step.num}</span>
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] whitespace-nowrap">{step.text}</span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] shrink-0 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-8">
        <p className="text-center text-sm font-medium text-[var(--color-text-secondary)] mb-5">
          역할을 선택하여 시작하세요
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isLoading = loading === role.key;
            return (
              <button
                key={role.key}
                onClick={() => enter(role)}
                disabled={loading !== null}
                className="group relative bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)]
                  p-6 text-left hover:shadow-md hover:border-[var(--color-accent-muted)]
                  active:scale-[0.99] transition-all duration-200 disabled:opacity-60 overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${role.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${role.iconBg} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-[var(--color-text)]">{role.label}</h3>
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{role.desc}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className={`w-6 h-6 ${role.iconBg} rounded-full flex items-center justify-center text-white text-[10px] font-bold`}>
                        {role.name.charAt(0)}
                      </div>
                      <span className="text-xs text-[var(--color-text-tertiary)]">{role.name} · {role.dept}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] p-3 rounded-xl text-center">
            {error}
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto px-6 pb-16">
        <button
          onClick={() => setShowSignIn(!showSignIn)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          이메일로 로그인
          <ChevronDown className={`w-4 h-4 transition-transform ${showSignIn ? 'rotate-180' : ''}`} />
        </button>

        {showSignIn && (
          <form onSubmit={handleManualLogin}
            className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-light)] p-6 space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">이메일</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl text-sm"
                placeholder="이메일을 입력하세요" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">비밀번호</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl text-sm"
                placeholder="비밀번호를 입력하세요" />
            </div>
            <button type="submit" disabled={manualLoading}
              className="w-full py-2.5 bg-[var(--color-accent)] text-white font-medium rounded-xl hover:bg-[var(--color-accent-hover)] transition disabled:opacity-50 text-sm">
              {manualLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-[var(--color-text-tertiary)] mt-6">
          모든 테스트 계정의 비밀번호는 <code className="bg-[var(--color-surface)] border border-[var(--color-border-light)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">1234</code> 입니다
        </p>
      </div>
    </div>
  );
}
