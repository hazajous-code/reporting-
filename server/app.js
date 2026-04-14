const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const authRoutes = require('./routes/auth');
const cycleRoutes = require('./routes/cycles');
const reportRoutes = require('./routes/reports');
const summaryRoutes = require('./routes/summaries');
const feedbackRoutes = require('./routes/feedback');
const dashboardRoutes = require('./routes/dashboard');
const reminderRoutes = require('./routes/reminders');

async function createApp() {
  await initDB();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/cycles', cycleRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/summaries', summaryRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reminders', reminderRoutes);

  const distPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return app;
}

module.exports = { createApp };
