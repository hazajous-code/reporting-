const express = require('express');
const { queryAll, queryOne, runSql } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const cycles = queryAll(`
    SELECT c.*, u.name as created_by_name
    FROM cycles c LEFT JOIN users u ON c.created_by = u.id
    ORDER BY c.start_date DESC
  `);
  res.json(cycles);
});

router.get('/:id', authenticate, (req, res) => {
  const cycle = queryOne(`
    SELECT c.*, u.name as created_by_name
    FROM cycles c LEFT JOIN users u ON c.created_by = u.id
    WHERE c.id = ?
  `, [req.params.id]);

  if (!cycle) return res.status(404).json({ error: '보고 사이클을 찾을 수 없습니다.' });

  const reportStats = queryOne(`
    SELECT 
      COUNT(*) as total_reports,
      SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_reports,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_reports
    FROM reports WHERE cycle_id = ?
  `, [req.params.id]);

  const summaryStats = queryOne(`
    SELECT COUNT(*) as total_summaries,
      SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_summaries
    FROM team_summaries WHERE cycle_id = ?
  `, [req.params.id]);

  const execReport = queryOne(`
    SELECT id, status FROM executive_reports WHERE cycle_id = ?
  `, [req.params.id]);

  res.json({ ...cycle, reportStats, summaryStats, executiveReport: execReport || null });
});

router.post('/', authenticate, authorize('leader', 'strategy', 'executive'), (req, res) => {
  const { title, start_date, end_date, frequency } = req.body;

  const result = runSql(`
    INSERT INTO cycles (title, start_date, end_date, frequency, status, created_by)
    VALUES (?, ?, ?, ?, 'collecting', ?)
  `, [title, start_date, end_date, frequency || 'weekly', req.user.id]);

  const cycle = queryOne('SELECT * FROM cycles WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(cycle);
});

router.patch('/:id/status', authenticate, authorize('leader', 'strategy', 'executive'), (req, res) => {
  const { status } = req.body;
  runSql('UPDATE cycles SET status = ? WHERE id = ?', [status, req.params.id]);
  const cycle = queryOne('SELECT * FROM cycles WHERE id = ?', [req.params.id]);
  res.json(cycle);
});

router.get('/:id/projects', authenticate, (req, res) => {
  let projects;
  if (req.user.role === 'staff' || req.user.role === 'leader') {
    projects = queryAll(`
      SELECT p.*, d.name as department_name 
      FROM projects p JOIN departments d ON p.department_id = d.id
      WHERE p.department_id = ? AND p.status = 'active'
    `, [req.user.department_id]);
  } else {
    projects = queryAll(`
      SELECT p.*, d.name as department_name 
      FROM projects p JOIN departments d ON p.department_id = d.id
      WHERE p.status = 'active'
      ORDER BY d.name, p.name
    `);
  }
  res.json(projects);
});

module.exports = router;
