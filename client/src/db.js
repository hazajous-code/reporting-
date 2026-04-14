const STORAGE_KEY = 'weeklyflow_db';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function save(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function getDB() {
  let db = load();
  if (!db || !db.users?.length) {
    db = createSeedData();
    save(db);
  }
  return db;
}

function persist(db) { save(db); }

let _nextIds = null;
function nextId(db, table) {
  if (!_nextIds) {
    _nextIds = {};
    for (const t of Object.keys(db)) {
      if (Array.isArray(db[t])) {
        _nextIds[t] = db[t].reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
      }
    }
  }
  const id = _nextIds[table] || 1;
  _nextIds[table] = id + 1;
  return id;
}

function now() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }

function createSeedData() {
  const departments = [
    { id: 1, name: 'Digital Business' },
    { id: 2, name: 'AI Solutions' },
    { id: 3, name: 'Platform' },
    { id: 4, name: 'Strategy & Planning' },
  ];

  const users = [
    { id: 1, name: 'John Kim', email: 'staff1@test.com', password: '1234', role: 'staff', department_id: 1 },
    { id: 2, name: 'Sarah Lee', email: 'staff2@test.com', password: '1234', role: 'staff', department_id: 1 },
    { id: 3, name: 'Mike Park', email: 'staff3@test.com', password: '1234', role: 'staff', department_id: 2 },
    { id: 4, name: 'Hannah Jung', email: 'staff4@test.com', password: '1234', role: 'staff', department_id: 2 },
    { id: 5, name: 'Daniel Choi', email: 'staff5@test.com', password: '1234', role: 'staff', department_id: 3 },
    { id: 6, name: 'Emily Kang', email: 'staff6@test.com', password: '1234', role: 'staff', department_id: 3 },
    { id: 7, name: 'David Oh', email: 'leader1@test.com', password: '1234', role: 'leader', department_id: 1 },
    { id: 8, name: 'James Han', email: 'leader2@test.com', password: '1234', role: 'leader', department_id: 2 },
    { id: 9, name: 'Chris Yoon', email: 'leader3@test.com', password: '1234', role: 'leader', department_id: 3 },
    { id: 10, name: 'Rachel Lim', email: 'strategy@test.com', password: '1234', role: 'strategy', department_id: 4 },
    { id: 11, name: 'Andrew Choi', email: 'exec@test.com', password: '1234', role: 'executive', department_id: null },
  ];

  const projects = [
    { id: 1, name: 'Smart Factory MES', department_id: 1, description: 'Manufacturing Execution System upgrade', status: 'active' },
    { id: 2, name: 'Cloud Migration', department_id: 1, description: 'On-premise to cloud transition', status: 'active' },
    { id: 3, name: 'AI Chatbot Service', department_id: 2, description: 'Customer support AI chatbot', status: 'active' },
    { id: 4, name: 'Video Analytics', department_id: 2, description: 'CCTV video AI analysis system', status: 'active' },
    { id: 5, name: 'Data Platform', department_id: 3, description: 'Unified data management platform', status: 'active' },
    { id: 6, name: 'API Gateway', department_id: 3, description: 'API management and monitoring', status: 'active' },
  ];

  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = d => d.toISOString().split('T')[0];

  const cycles = [
    { id: 1, title: `Weekly Report — ${fmt(monday)}`, start_date: fmt(monday), end_date: fmt(friday), frequency: 'weekly', status: 'collecting', created_by: 10, created_at: now() },
  ];

  return {
    departments, users, projects, cycles,
    reports: [], team_summaries: [], executive_reports: [], feedback: [], reminders: [],
  };
}

// ── Auth ──
export function login(email, password) {
  const db = getDB();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password.');
  const dept = db.departments.find(d => d.id === user.department_id);
  const token = btoa(JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role, department_id: user.department_id }));
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, department_id: user.department_id, department_name: dept?.name || null },
  };
}

export function getMe(userId) {
  const db = getDB();
  const u = db.users.find(x => x.id === userId);
  if (!u) return null;
  const d = db.departments.find(x => x.id === u.department_id);
  return { id: u.id, name: u.name, email: u.email, role: u.role, department_id: u.department_id, department_name: d?.name || null };
}

export function getUsers() {
  const db = getDB();
  return db.users.map(u => {
    const d = db.departments.find(x => x.id === u.department_id);
    return { id: u.id, name: u.name, email: u.email, role: u.role, department_id: u.department_id, department_name: d?.name || null };
  });
}

// ── Cycles ──
export function getCycles() {
  const db = getDB();
  return db.cycles.map(c => ({ ...c, created_by_name: db.users.find(u => u.id === c.created_by)?.name })).sort((a, b) => b.start_date.localeCompare(a.start_date));
}

export function getCycle(id) {
  const db = getDB();
  const c = db.cycles.find(x => x.id === +id);
  if (!c) return null;
  const reportStats = {
    total_reports: db.reports.filter(r => r.cycle_id === c.id).length,
    submitted_reports: db.reports.filter(r => r.cycle_id === c.id && r.status === 'submitted').length,
    draft_reports: db.reports.filter(r => r.cycle_id === c.id && r.status === 'draft').length,
  };
  const summaryStats = {
    total_summaries: db.team_summaries.filter(s => s.cycle_id === c.id).length,
    submitted_summaries: db.team_summaries.filter(s => s.cycle_id === c.id && s.status === 'submitted').length,
  };
  const execReport = db.executive_reports.find(e => e.cycle_id === c.id);
  return { ...c, created_by_name: db.users.find(u => u.id === c.created_by)?.name, reportStats, summaryStats, executiveReport: execReport ? { id: execReport.id, status: execReport.status } : null };
}

export function createCycle(data, userId) {
  const db = getDB();
  const cycle = { id: nextId(db, 'cycles'), title: data.title, start_date: data.start_date, end_date: data.end_date, frequency: data.frequency || 'weekly', status: 'collecting', created_by: userId, created_at: now() };
  db.cycles.push(cycle);
  persist(db);
  return cycle;
}

export function updateCycleStatus(id, status) {
  const db = getDB();
  const c = db.cycles.find(x => x.id === +id);
  if (c) { c.status = status; persist(db); }
  return c;
}

export function getCycleProjects(cycleId, user) {
  const db = getDB();
  if (user.role === 'staff' || user.role === 'leader') {
    return db.projects.filter(p => p.department_id === user.department_id && p.status === 'active').map(p => ({ ...p, department_name: db.departments.find(d => d.id === p.department_id)?.name }));
  }
  return db.projects.filter(p => p.status === 'active').map(p => ({ ...p, department_name: db.departments.find(d => d.id === p.department_id)?.name }));
}

// ── Reports ──
function enrichReport(r, db) {
  const p = db.projects.find(x => x.id === r.project_id);
  const d = p ? db.departments.find(x => x.id === p.department_id) : null;
  const u = db.users.find(x => x.id === r.submitted_by);
  return { ...r, project_name: p?.name, department_name: d?.name, submitted_by_name: u?.name };
}

export function getReportsByCycle(cycleId, user) {
  const db = getDB();
  let reports = db.reports.filter(r => r.cycle_id === +cycleId);
  if (user.role === 'staff') reports = reports.filter(r => r.submitted_by === user.id);
  else if (user.role === 'leader') {
    const deptProjects = db.projects.filter(p => p.department_id === user.department_id).map(p => p.id);
    reports = reports.filter(r => deptProjects.includes(r.project_id));
  }
  return reports.map(r => enrichReport(r, db));
}

export function getReport(id) {
  const db = getDB();
  const r = db.reports.find(x => x.id === +id);
  if (!r) return null;
  const feedbacks = db.feedback.filter(f => f.target_type === 'report' && f.target_id === r.id).map(f => ({
    ...f, from_user_name: db.users.find(u => u.id === f.from_user_id)?.name, from_user_role: db.users.find(u => u.id === f.from_user_id)?.role,
  })).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { ...enrichReport(r, db), feedbacks };
}

export function createReport(data, userId) {
  const db = getDB();
  const report = { id: nextId(db, 'reports'), cycle_id: data.cycle_id, project_id: data.project_id, submitted_by: userId, content: data.content, key_achievements: data.key_achievements || null, issues: data.issues || null, next_plans: data.next_plans || null, progress_percent: data.progress_percent || 0, status: data.status || 'draft', submitted_at: data.status === 'submitted' ? now() : null, created_at: now(), updated_at: now() };
  db.reports.push(report);
  persist(db);
  return report;
}

export function updateReport(id, data) {
  const db = getDB();
  const r = db.reports.find(x => x.id === +id);
  if (!r) return null;
  Object.assign(r, { content: data.content, key_achievements: data.key_achievements || null, issues: data.issues || null, next_plans: data.next_plans || null, progress_percent: data.progress_percent || 0, status: data.status || r.status, updated_at: now() });
  if (data.status === 'submitted' && !r.submitted_at) r.submitted_at = now();
  persist(db);
  return r;
}

// ── Team Summaries ──
export function getTeamSummaries(cycleId, user) {
  const db = getDB();
  let sums = db.team_summaries.filter(s => s.cycle_id === +cycleId);
  if (user.role === 'leader') sums = sums.filter(s => s.department_id === user.department_id);
  return sums.map(s => ({ ...s, department_name: db.departments.find(d => d.id === s.department_id)?.name, summarized_by_name: db.users.find(u => u.id === s.summarized_by)?.name }));
}

export function saveTeamSummary(data, user) {
  const db = getDB();
  let existing = db.team_summaries.find(s => s.cycle_id === data.cycle_id && s.department_id === user.department_id);
  if (existing) {
    Object.assign(existing, { summary_content: data.summary_content, key_points: data.key_points || null, risk_items: data.risk_items || null, status: data.status || 'draft', updated_at: now() });
    if (data.status === 'submitted' && !existing.submitted_at) existing.submitted_at = now();
    persist(db);
    return existing;
  }
  const s = { id: nextId(db, 'team_summaries'), cycle_id: data.cycle_id, department_id: user.department_id, summarized_by: user.id, summary_content: data.summary_content, key_points: data.key_points || null, risk_items: data.risk_items || null, status: data.status || 'draft', submitted_at: data.status === 'submitted' ? now() : null, created_at: now(), updated_at: now() };
  db.team_summaries.push(s);
  persist(db);
  return s;
}

// ── Executive Reports ──
export function getExecReport(cycleId) {
  const db = getDB();
  const r = db.executive_reports.find(e => e.cycle_id === +cycleId);
  if (!r) return null;
  const feedbacks = db.feedback.filter(f => f.target_type === 'executive_report' && f.target_id === r.id).map(f => ({
    ...f, from_user_name: db.users.find(u => u.id === f.from_user_id)?.name, from_user_role: db.users.find(u => u.id === f.from_user_id)?.role,
  })).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { ...r, prepared_by_name: db.users.find(u => u.id === r.prepared_by)?.name, feedbacks };
}

export function saveExecReport(data, userId) {
  const db = getDB();
  let existing = db.executive_reports.find(e => e.cycle_id === data.cycle_id);
  if (existing) {
    Object.assign(existing, { overall_summary: data.overall_summary, highlights: data.highlights || null, risks_and_issues: data.risks_and_issues || null, decisions_needed: data.decisions_needed || null, status: data.status || 'draft', updated_at: now() });
    if (data.status === 'submitted' && !existing.submitted_at) existing.submitted_at = now();
    persist(db);
    return existing;
  }
  const r = { id: nextId(db, 'executive_reports'), cycle_id: data.cycle_id, prepared_by: userId, overall_summary: data.overall_summary, highlights: data.highlights || null, risks_and_issues: data.risks_and_issues || null, decisions_needed: data.decisions_needed || null, status: data.status || 'draft', submitted_at: data.status === 'submitted' ? now() : null, created_at: now(), updated_at: now() };
  db.executive_reports.push(r);
  persist(db);
  return r;
}

// ── Feedback ──
export function sendFeedback(data, fromUserId) {
  const db = getDB();
  const f = { id: nextId(db, 'feedback'), target_type: data.target_type, target_id: data.target_id, from_user_id: fromUserId, to_user_id: data.to_user_id, content: data.content, is_read: 0, created_at: now() };
  db.feedback.push(f);
  persist(db);
  const fromUser = db.users.find(u => u.id === fromUserId);
  return { ...f, from_user_name: fromUser?.name, from_user_role: fromUser?.role };
}

function feedbackTargetName(f, db) {
  if (f.target_type === 'report') { const r = db.reports.find(x => x.id === f.target_id); const p = r ? db.projects.find(x => x.id === r.project_id) : null; return p?.name; }
  if (f.target_type === 'team_summary') { const s = db.team_summaries.find(x => x.id === f.target_id); const d = s ? db.departments.find(x => x.id === s.department_id) : null; return d?.name; }
  return 'Executive Report';
}

export function getReceivedFeedback(userId) {
  const db = getDB();
  return db.feedback.filter(f => f.to_user_id === userId).map(f => ({
    ...f, from_user_name: db.users.find(u => u.id === f.from_user_id)?.name, from_user_role: db.users.find(u => u.id === f.from_user_id)?.role, target_name: feedbackTargetName(f, db),
  })).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getSentFeedback(userId) {
  const db = getDB();
  return db.feedback.filter(f => f.from_user_id === userId).map(f => ({
    ...f, to_user_name: db.users.find(u => u.id === f.to_user_id)?.name, target_name: feedbackTargetName(f, db),
  })).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function markFeedbackRead(id, userId) {
  const db = getDB();
  const f = db.feedback.find(x => x.id === +id && x.to_user_id === userId);
  if (f) { f.is_read = 1; persist(db); }
}

export function markAllFeedbackRead(userId) {
  const db = getDB();
  db.feedback.filter(f => f.to_user_id === userId).forEach(f => f.is_read = 1);
  persist(db);
}

// ── Reminders ──
export function getReminders(userId) {
  const db = getDB();
  return db.reminders.filter(r => r.target_user_id === userId).map(r => ({ ...r, cycle_title: db.cycles.find(c => c.id === r.cycle_id)?.title })).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function sendRemindersToTeam(data, user) {
  const db = getDB();
  const staffUsers = db.users.filter(u => u.department_id === (data.department_id || user.department_id) && u.role === 'staff');
  for (const u of staffUsers) {
    db.reminders.push({ id: nextId(db, 'reminders'), cycle_id: data.cycle_id, target_user_id: u.id, message: data.message, reminder_type: data.reminder_type || 'submit', is_read: 0, created_at: now() });
  }
  persist(db);
  return { success: true, count: staffUsers.length };
}

export function markReminderRead(id, userId) {
  const db = getDB();
  const r = db.reminders.find(x => x.id === +id && x.target_user_id === userId);
  if (r) { r.is_read = 1; persist(db); }
}

export function markAllRemindersRead(userId) {
  const db = getDB();
  db.reminders.filter(r => r.target_user_id === userId).forEach(r => r.is_read = 1);
  persist(db);
}

// ── Dashboard ──
export function getDashboard(user) {
  const db = getDB();
  const activeCycle = db.cycles.find(c => c.status !== 'closed') || null;
  const unreadFeedback = db.feedback.filter(f => f.to_user_id === user.id && !f.is_read).length;
  const unreadReminders = db.reminders.filter(r => r.target_user_id === user.id && !r.is_read).length;

  let stats = {};
  if (user.role === 'staff' && activeCycle) {
    const myReports = db.reports.filter(r => r.cycle_id === activeCycle.id && r.submitted_by === user.id);
    stats = { myReports: { total: myReports.length, submitted: myReports.filter(r => r.status === 'submitted').length, drafts: myReports.filter(r => r.status === 'draft').length }, myProjects: db.projects.filter(p => p.department_id === user.department_id && p.status === 'active').length };
  }
  if (user.role === 'leader' && activeCycle) {
    const deptProjects = db.projects.filter(p => p.department_id === user.department_id).map(p => p.id);
    const teamReports = db.reports.filter(r => r.cycle_id === activeCycle.id && deptProjects.includes(r.project_id));
    stats = { teamReports: { total: teamReports.length, submitted: teamReports.filter(r => r.status === 'submitted').length, drafts: teamReports.filter(r => r.status === 'draft').length }, mySummary: db.team_summaries.find(s => s.cycle_id === activeCycle.id && s.department_id === user.department_id) || null, teamMembers: db.users.filter(u => u.department_id === user.department_id && u.role === 'staff').length };
  }
  if (user.role === 'strategy' && activeCycle) {
    stats = { allSummaries: db.team_summaries.filter(s => s.cycle_id === activeCycle.id).map(s => ({ ...s, department_name: db.departments.find(d => d.id === s.department_id)?.name })), totalDepartments: db.departments.length, executiveReport: db.executive_reports.find(e => e.cycle_id === activeCycle.id) || null };
  }
  if (user.role === 'executive' && activeCycle) {
    const er = db.executive_reports.find(e => e.cycle_id === activeCycle.id);
    stats = { executiveReport: er ? { ...er, prepared_by_name: db.users.find(u => u.id === er.prepared_by)?.name } : null, teamSummaries: db.team_summaries.filter(s => s.cycle_id === activeCycle.id).map(s => ({ status: s.status, department_name: db.departments.find(d => d.id === s.department_id)?.name })) };
  }

  const recentFeedback = db.feedback.filter(f => f.to_user_id === user.id).map(f => ({
    ...f, from_user_name: db.users.find(u => u.id === f.from_user_id)?.name, from_user_role: db.users.find(u => u.id === f.from_user_id)?.role,
  })).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  return { activeCycle, unreadFeedback, unreadReminders, stats, recentFeedback };
}

// ── Projects ──
export function createProject(data, user) {
  const db = getDB();
  const p = {
    id: nextId(db, 'projects'),
    name: data.name,
    department_id: user.department_id,
    description: data.description || null,
    status: 'active',
    created_at: now(),
  };
  db.projects.push(p);
  persist(db);
  return { ...p, department_name: db.departments.find(d => d.id === p.department_id)?.name };
}
