const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryAll, queryOne, runSql } = require('../db');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = queryOne(`
    SELECT u.*, d.name as department_name 
    FROM users u LEFT JOIN departments d ON u.department_id = d.id 
    WHERE u.email = ?
  `, [email]);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, department_id: user.department_id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id, name: user.name, email: user.email, role: user.role,
      department_id: user.department_id, department_name: user.department_name
    }
  });
});

router.get('/me', authenticate, (req, res) => {
  const user = queryOne(`
    SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name
    FROM users u LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `, [req.user.id]);

  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  res.json(user);
});

router.get('/users', authenticate, (req, res) => {
  const users = queryAll(`
    SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name
    FROM users u LEFT JOIN departments d ON u.department_id = d.id
    ORDER BY u.role, u.name
  `);
  res.json(users);
});

router.get('/departments', authenticate, (req, res) => {
  const departments = queryAll('SELECT * FROM departments ORDER BY name');
  res.json(departments);
});

module.exports = router;
