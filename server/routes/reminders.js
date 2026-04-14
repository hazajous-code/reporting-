const express = require('express');
const { queryAll, queryOne, runSql } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const reminders = queryAll(`
    SELECT r.*, c.title as cycle_title
    FROM reminders r JOIN cycles c ON r.cycle_id = c.id
    WHERE r.target_user_id = ?
    ORDER BY r.created_at DESC
  `, [req.user.id]);
  res.json(reminders);
});

router.post('/send', authenticate, authorize('leader', 'strategy', 'executive'), (req, res) => {
  const { cycle_id, target_user_ids, message, reminder_type } = req.body;

  for (const uid of target_user_ids) {
    runSql(`INSERT INTO reminders (cycle_id, target_user_id, message, reminder_type) VALUES (?, ?, ?, ?)`,
      [cycle_id, uid, message, reminder_type]);
  }

  res.status(201).json({ success: true, count: target_user_ids.length });
});

router.post('/send-to-department', authenticate, authorize('leader', 'strategy'), (req, res) => {
  const { cycle_id, department_id, message, reminder_type } = req.body;

  const staffUsers = queryAll(`
    SELECT id FROM users WHERE department_id = ? AND role = 'staff'
  `, [department_id || req.user.department_id]);

  for (const u of staffUsers) {
    runSql(`INSERT INTO reminders (cycle_id, target_user_id, message, reminder_type) VALUES (?, ?, ?, ?)`,
      [cycle_id, u.id, message, reminder_type || 'submit']);
  }

  res.status(201).json({ success: true, count: staffUsers.length });
});

router.patch('/:id/read', authenticate, (req, res) => {
  runSql('UPDATE reminders SET is_read = 1 WHERE id = ? AND target_user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

router.patch('/read-all', authenticate, (req, res) => {
  runSql('UPDATE reminders SET is_read = 1 WHERE target_user_id = ?', [req.user.id]);
  res.json({ success: true });
});

module.exports = router;
