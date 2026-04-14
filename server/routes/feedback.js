const express = require('express');
const { queryAll, queryOne, runSql } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, (req, res) => {
  const { target_type, target_id, to_user_id, content } = req.body;

  const result = runSql(`
    INSERT INTO feedback (target_type, target_id, from_user_id, to_user_id, content)
    VALUES (?, ?, ?, ?, ?)
  `, [target_type, target_id, req.user.id, to_user_id, content]);

  const feedback = queryOne(`
    SELECT f.*, u.name as from_user_name, u.role as from_user_role
    FROM feedback f JOIN users u ON f.from_user_id = u.id
    WHERE f.id = ?
  `, [result.lastInsertRowid]);

  res.status(201).json(feedback);
});

router.get('/received', authenticate, (req, res) => {
  const feedbacks = queryAll(`
    SELECT f.*, u.name as from_user_name, u.role as from_user_role,
      CASE f.target_type
        WHEN 'report' THEN (SELECT p.name FROM reports r JOIN projects p ON r.project_id = p.id WHERE r.id = f.target_id)
        WHEN 'team_summary' THEN (SELECT d.name FROM team_summaries ts JOIN departments d ON ts.department_id = d.id WHERE ts.id = f.target_id)
        WHEN 'executive_report' THEN '임원 보고서'
      END as target_name
    FROM feedback f
    JOIN users u ON f.from_user_id = u.id
    WHERE f.to_user_id = ?
    ORDER BY f.created_at DESC
  `, [req.user.id]);

  res.json(feedbacks);
});

router.get('/sent', authenticate, (req, res) => {
  const feedbacks = queryAll(`
    SELECT f.*, u.name as to_user_name,
      CASE f.target_type
        WHEN 'report' THEN (SELECT p.name FROM reports r JOIN projects p ON r.project_id = p.id WHERE r.id = f.target_id)
        WHEN 'team_summary' THEN (SELECT d.name FROM team_summaries ts JOIN departments d ON ts.department_id = d.id WHERE ts.id = f.target_id)
        WHEN 'executive_report' THEN '임원 보고서'
      END as target_name
    FROM feedback f
    JOIN users u ON f.to_user_id = u.id
    WHERE f.from_user_id = ?
    ORDER BY f.created_at DESC
  `, [req.user.id]);

  res.json(feedbacks);
});

router.patch('/:id/read', authenticate, (req, res) => {
  runSql('UPDATE feedback SET is_read = 1 WHERE id = ? AND to_user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

router.patch('/read-all', authenticate, (req, res) => {
  runSql('UPDATE feedback SET is_read = 1 WHERE to_user_id = ?', [req.user.id]);
  res.json({ success: true });
});

module.exports = router;
