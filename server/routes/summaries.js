const express = require('express');
const { queryAll, queryOne, runSql } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/team/cycle/:cycleId', authenticate, (req, res) => {
  const { cycleId } = req.params;
  let summaries;

  if (req.user.role === 'leader') {
    summaries = queryAll(`
      SELECT ts.*, d.name as department_name, u.name as summarized_by_name
      FROM team_summaries ts
      JOIN departments d ON ts.department_id = d.id
      JOIN users u ON ts.summarized_by = u.id
      WHERE ts.cycle_id = ? AND ts.department_id = ?
    `, [cycleId, req.user.department_id]);
  } else {
    summaries = queryAll(`
      SELECT ts.*, d.name as department_name, u.name as summarized_by_name
      FROM team_summaries ts
      JOIN departments d ON ts.department_id = d.id
      JOIN users u ON ts.summarized_by = u.id
      WHERE ts.cycle_id = ?
      ORDER BY d.name
    `, [cycleId]);
  }

  res.json(summaries);
});

router.get('/team/:id', authenticate, (req, res) => {
  const summary = queryOne(`
    SELECT ts.*, d.name as department_name, u.name as summarized_by_name
    FROM team_summaries ts
    JOIN departments d ON ts.department_id = d.id
    JOIN users u ON ts.summarized_by = u.id
    WHERE ts.id = ?
  `, [req.params.id]);

  if (!summary) return res.status(404).json({ error: '팀 서머리를 찾을 수 없습니다.' });

  const feedbacks = queryAll(`
    SELECT f.*, u.name as from_user_name, u.role as from_user_role
    FROM feedback f JOIN users u ON f.from_user_id = u.id
    WHERE f.target_type = 'team_summary' AND f.target_id = ?
    ORDER BY f.created_at DESC
  `, [req.params.id]);

  res.json({ ...summary, feedbacks });
});

router.post('/team', authenticate, authorize('leader'), (req, res) => {
  const { cycle_id, summary_content, key_points, risk_items, status } = req.body;
  const submittedAt = status === 'submitted' ? new Date().toISOString() : null;

  const existing = queryOne('SELECT id FROM team_summaries WHERE cycle_id = ? AND department_id = ?',
    [cycle_id, req.user.department_id]);

  if (existing) {
    runSql(`
      UPDATE team_summaries SET summary_content=?, key_points=?, risk_items=?, status=?, submitted_at=COALESCE(?, submitted_at), updated_at=CURRENT_TIMESTAMP
      WHERE id = ?
    `, [summary_content, key_points || null, risk_items || null, status || 'draft', submittedAt, existing.id]);
    const summary = queryOne('SELECT * FROM team_summaries WHERE id = ?', [existing.id]);
    return res.json(summary);
  }

  const result = runSql(`
    INSERT INTO team_summaries (cycle_id, department_id, summarized_by, summary_content, key_points, risk_items, status, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [cycle_id, req.user.department_id, req.user.id, summary_content, key_points || null, risk_items || null, status || 'draft', submittedAt]);

  const summary = queryOne('SELECT * FROM team_summaries WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(summary);
});

router.get('/executive/cycle/:cycleId', authenticate, (req, res) => {
  const report = queryOne(`
    SELECT er.*, u.name as prepared_by_name
    FROM executive_reports er
    JOIN users u ON er.prepared_by = u.id
    WHERE er.cycle_id = ?
  `, [req.params.cycleId]);

  if (!report) return res.json(null);

  const feedbacks = queryAll(`
    SELECT f.*, u.name as from_user_name, u.role as from_user_role
    FROM feedback f JOIN users u ON f.from_user_id = u.id
    WHERE f.target_type = 'executive_report' AND f.target_id = ?
    ORDER BY f.created_at DESC
  `, [report.id]);

  res.json({ ...report, feedbacks });
});

router.post('/executive', authenticate, authorize('strategy'), (req, res) => {
  const { cycle_id, overall_summary, highlights, risks_and_issues, decisions_needed, status } = req.body;
  const submittedAt = status === 'submitted' ? new Date().toISOString() : null;

  const existing = queryOne('SELECT id FROM executive_reports WHERE cycle_id = ?', [cycle_id]);

  if (existing) {
    runSql(`
      UPDATE executive_reports SET overall_summary=?, highlights=?, risks_and_issues=?, decisions_needed=?, status=?, submitted_at=COALESCE(?, submitted_at), updated_at=CURRENT_TIMESTAMP
      WHERE id = ?
    `, [overall_summary, highlights || null, risks_and_issues || null, decisions_needed || null, status || 'draft', submittedAt, existing.id]);
    const report = queryOne('SELECT * FROM executive_reports WHERE id = ?', [existing.id]);
    return res.json(report);
  }

  const result = runSql(`
    INSERT INTO executive_reports (cycle_id, prepared_by, overall_summary, highlights, risks_and_issues, decisions_needed, status, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [cycle_id, req.user.id, overall_summary, highlights || null, risks_and_issues || null, decisions_needed || null, status || 'draft', submittedAt]);

  const report = queryOne('SELECT * FROM executive_reports WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(report);
});

module.exports = router;
