import * as db from './db';

function getUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function delay(ms = 50) {
  return new Promise(r => setTimeout(r, ms));
}

async function route(method, path, body) {
  await delay();
  const user = getUser();

  // Auth
  if (path === '/auth/login' && method === 'POST') return db.login(body.email, body.password);
  if (path === '/auth/me') return db.getMe(user.id);
  if (path === '/auth/users') return db.getUsers();
  if (path === '/auth/departments') {
    const d = JSON.parse(localStorage.getItem('weeklyflow_db'));
    return d?.departments || [];
  }

  // Cycles
  if (path === '/cycles' && method === 'GET') return db.getCycles();
  if (path.match(/^\/cycles\/(\d+)$/) && method === 'GET') return db.getCycle(path.split('/')[2]);
  if (path === '/cycles' && method === 'POST') return db.createCycle(body, user.id);
  if (path.match(/^\/cycles\/(\d+)\/status$/) && method === 'PATCH') return db.updateCycleStatus(path.split('/')[2], body.status);
  if (path.match(/^\/cycles\/(\d+)\/projects$/)) return db.getCycleProjects(path.split('/')[2], user);

  // Reports
  if (path.match(/^\/reports\/cycle\/(\d+)$/)) return db.getReportsByCycle(path.split('/')[3], user);
  if (path.match(/^\/reports\/(\d+)$/) && method === 'GET') return db.getReport(path.split('/')[2]);
  if (path === '/reports' && method === 'POST') return db.createReport(body, user.id);
  if (path.match(/^\/reports\/(\d+)$/) && method === 'PUT') return db.updateReport(path.split('/')[2], body);

  // Summaries
  if (path.match(/^\/summaries\/team\/cycle\/(\d+)$/)) return db.getTeamSummaries(path.split('/')[4], user);
  if (path === '/summaries/team' && method === 'POST') return db.saveTeamSummary(body, user);
  if (path.match(/^\/summaries\/executive\/cycle\/(\d+)$/)) return db.getExecReport(path.split('/')[4]);
  if (path === '/summaries/executive' && method === 'POST') return db.saveExecReport(body, user.id);

  // Feedback
  if (path === '/feedback' && method === 'POST') return db.sendFeedback(body, user.id);
  if (path === '/feedback/received') return db.getReceivedFeedback(user.id);
  if (path === '/feedback/sent') return db.getSentFeedback(user.id);
  if (path.match(/^\/feedback\/(\d+)\/read$/) && method === 'PATCH') { db.markFeedbackRead(path.split('/')[2], user.id); return { success: true }; }
  if (path === '/feedback/read-all' && method === 'PATCH') { db.markAllFeedbackRead(user.id); return { success: true }; }

  // Reminders
  if (path === '/reminders' && method === 'GET') return db.getReminders(user.id);
  if (path === '/reminders/send-to-department' && method === 'POST') return db.sendRemindersToTeam(body, user);
  if (path.match(/^\/reminders\/(\d+)\/read$/) && method === 'PATCH') { db.markReminderRead(path.split('/')[2], user.id); return { success: true }; }
  if (path === '/reminders/read-all' && method === 'PATCH') { db.markAllRemindersRead(user.id); return { success: true }; }

  // Projects
  if (path === '/projects' && method === 'POST') return db.createProject(body, user);

  // Dashboard
  if (path === '/dashboard') return db.getDashboard(user);

  console.warn('Unmatched route:', method, path);
  return null;
}

export const api = {
  get: (path) => route('GET', path),
  post: (path, body) => route('POST', path, body),
  put: (path, body) => route('PUT', path, body),
  patch: (path, body) => route('PATCH', path, body),
};
