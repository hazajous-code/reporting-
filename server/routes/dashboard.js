const express = require('express');
const { queryAll, queryOne } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const { role, id: userId, department_id } = req.user;

  const activeCycle = queryOne(`
    SELECT * FROM cycles WHERE status != 'closed' ORDER BY start_date DESC LIMIT 1
  `);

  const unreadFeedback = queryOne(`
    SELECT COUNT(*) as count FROM feedback WHERE to_user_id = ? AND is_read = 0
  `, [userId]);

  const unreadReminders = queryOne(`
    SELECT COUNT(*) as count FROM reminders WHERE target_user_id = ? AND is_read = 0
  `, [userId]);

  let stats = {};

  if (role === 'staff' && activeCycle) {
    const myReports = queryOne(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
        SUM(CASE WHEN status = 'revision_requested' THEN 1 ELSE 0 END) as revisions
      FROM reports WHERE cycle_id = ? AND submitted_by = ?
    `, [activeCycle.id, userId]);
    const myProjects = queryOne(`
      SELECT COUNT(*) as count FROM projects WHERE department_id = ? AND status = 'active'
    `, [department_id]);
    stats = { myReports, myProjects: myProjects.count };
  }

  if (role === 'leader' && activeCycle) {
    const teamReports = queryOne(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN r.status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN r.status = 'draft' THEN 1 ELSE 0 END) as drafts
      FROM reports r JOIN projects p ON r.project_id = p.id
      WHERE r.cycle_id = ? AND p.department_id = ?
    `, [activeCycle.id, department_id]);
    const mySummary = queryOne(`
      SELECT id, status FROM team_summaries WHERE cycle_id = ? AND department_id = ?
    `, [activeCycle.id, department_id]);
    const teamMembers = queryOne(`
      SELECT COUNT(*) as count FROM users WHERE department_id = ? AND role = 'staff'
    `, [department_id]);
    stats = { teamReports, mySummary: mySummary || null, teamMembers: teamMembers.count };
  }

  if (role === 'strategy' && activeCycle) {
    const allSummaries = queryAll(`
      SELECT ts.*, d.name as department_name
      FROM team_summaries ts JOIN departments d ON ts.department_id = d.id
      WHERE ts.cycle_id = ?
    `, [activeCycle.id]);
    const totalDepts = queryOne('SELECT COUNT(*) as count FROM departments');
    const execReport = queryOne(`
      SELECT id, status FROM executive_reports WHERE cycle_id = ?
    `, [activeCycle.id]);
    stats = { allSummaries, totalDepartments: totalDepts.count, executiveReport: execReport || null };
  }

  if (role === 'executive' && activeCycle) {
    const execReport = queryOne(`
      SELECT er.*, u.name as prepared_by_name
      FROM executive_reports er JOIN users u ON er.prepared_by = u.id
      WHERE er.cycle_id = ?
    `, [activeCycle.id]);
    const allSummaries = queryAll(`
      SELECT ts.status, d.name as department_name
      FROM team_summaries ts JOIN departments d ON ts.department_id = d.id
      WHERE ts.cycle_id = ?
    `, [activeCycle.id]);
    stats = { executiveReport: execReport || null, teamSummaries: allSummaries };
  }

  const recentFeedback = queryAll(`
    SELECT f.*, u.name as from_user_name, u.role as from_user_role
    FROM feedback f JOIN users u ON f.from_user_id = u.id
    WHERE f.to_user_id = ?
    ORDER BY f.created_at DESC LIMIT 5
  `, [userId]);

  res.json({
    activeCycle,
    unreadFeedback: unreadFeedback?.count || 0,
    unreadReminders: unreadReminders?.count || 0,
    stats,
    recentFeedback
  });
});

module.exports = router;
