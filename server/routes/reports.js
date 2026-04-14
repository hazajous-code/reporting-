const express = require('express');
const { queryAll, queryOne, runSql } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/cycle/:cycleId', authenticate, (req, res) => {
  const { cycleId } = req.params;
  let reports;

  if (req.user.role === 'staff') {
    reports = queryAll(`
      SELECT r.*, p.name as project_name, d.name as department_name, u.name as submitted_by_name
      FROM reports r
      JOIN projects p ON r.project_id = p.id
      JOIN departments d ON p.department_id = d.id
      JOIN users u ON r.submitted_by = u.id
      WHERE r.cycle_id = ? AND r.submitted_by = ?
      ORDER BY r.updated_at DESC
    `, [cycleId, req.user.id]);
  } else if (req.user.role === 'leader') {
    reports = queryAll(`
      SELECT r.*, p.name as project_name, d.name as department_name, u.name as submitted_by_name
      FROM reports r
      JOIN projects p ON r.project_id = p.id
      JOIN departments d ON p.department_id = d.id
      JOIN users u ON r.submitted_by = u.id
      WHERE r.cycle_id = ? AND p.department_id = ?
      ORDER BY p.name, r.updated_at DESC
    `, [cycleId, req.user.department_id]);
  } else {
    reports = queryAll(`
      SELECT r.*, p.name as project_name, d.name as department_name, u.name as submitted_by_name
      FROM reports r
      JOIN projects p ON r.project_id = p.id
      JOIN departments d ON p.department_id = d.id
      JOIN users u ON r.submitted_by = u.id
      WHERE r.cycle_id = ?
      ORDER BY d.name, p.name, r.updated_at DESC
    `, [cycleId]);
  }

  res.json(reports);
});

router.get('/:id', authenticate, (req, res) => {
  const report = queryOne(`
    SELECT r.*, p.name as project_name, d.name as department_name, u.name as submitted_by_name
    FROM reports r
    JOIN projects p ON r.project_id = p.id
    JOIN departments d ON p.department_id = d.id
    JOIN users u ON r.submitted_by = u.id
    WHERE r.id = ?
  `, [req.params.id]);

  if (!report) return res.status(404).json({ error: '보고서를 찾을 수 없습니다.' });

  const feedbacks = queryAll(`
    SELECT f.*, u.name as from_user_name, u.role as from_user_role
    FROM feedback f JOIN users u ON f.from_user_id = u.id
    WHERE f.target_type = 'report' AND f.target_id = ?
    ORDER BY f.created_at DESC
  `, [req.params.id]);

  res.json({ ...report, feedbacks });
});

router.post('/', authenticate, authorize('staff'), (req, res) => {
  const { cycle_id, project_id, content, key_achievements, issues, next_plans, progress_percent, status } = req.body;
  const submittedAt = status === 'submitted' ? new Date().toISOString() : null;

  const result = runSql(`
    INSERT INTO reports (cycle_id, project_id, submitted_by, content, key_achievements, issues, next_plans, progress_percent, status, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [cycle_id, project_id, req.user.id, content, key_achievements || null, issues || null, next_plans || null, progress_percent || 0, status || 'draft', submittedAt]);

  const report = queryOne('SELECT * FROM reports WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(report);
});

router.put('/:id', authenticate, (req, res) => {
  const existing = queryOne('SELECT * FROM reports WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: '보고서를 찾을 수 없습니다.' });

  const { content, key_achievements, issues, next_plans, progress_percent, status } = req.body;
  const submittedAt = status === 'submitted' && existing.status !== 'submitted' ? new Date().toISOString() : existing.submitted_at;

  runSql(`
    UPDATE reports SET content=?, key_achievements=?, issues=?, next_plans=?, progress_percent=?, status=?, submitted_at=?, updated_at=CURRENT_TIMESTAMP
    WHERE id = ?
  `, [content, key_achievements || null, issues || null, next_plans || null, progress_percent || 0, status || existing.status, submittedAt, req.params.id]);

  const report = queryOne('SELECT * FROM reports WHERE id = ?', [req.params.id]);
  res.json(report);
});

module.exports = router;
