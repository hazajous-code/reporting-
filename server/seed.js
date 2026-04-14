const { initDB, queryOne, runSql, queryAll, saveDB } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  await initDB();

  runSql('DELETE FROM feedback');
  runSql('DELETE FROM reminders');
  runSql('DELETE FROM executive_reports');
  runSql('DELETE FROM team_summaries');
  runSql('DELETE FROM reports');
  runSql('DELETE FROM cycles');
  runSql('DELETE FROM projects');
  runSql('DELETE FROM users');
  runSql('DELETE FROM departments');

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const depts = ['Digital Business', 'AI Solutions', 'Platform', 'Strategy & Planning'];
  for (const name of depts) {
    runSql('INSERT INTO departments (name) VALUES (?)', [name]);
  }

  const deptRows = queryAll('SELECT * FROM departments');
  const deptMap = {};
  for (const d of deptRows) deptMap[d.name] = d.id;

  const users = [
    { name: 'John Kim', email: 'staff1@test.com', password: hash('1234'), role: 'staff', dept: 'Digital Business' },
    { name: 'Sarah Lee', email: 'staff2@test.com', password: hash('1234'), role: 'staff', dept: 'Digital Business' },
    { name: 'Mike Park', email: 'staff3@test.com', password: hash('1234'), role: 'staff', dept: 'AI Solutions' },
    { name: 'Hannah Jung', email: 'staff4@test.com', password: hash('1234'), role: 'staff', dept: 'AI Solutions' },
    { name: 'Daniel Choi', email: 'staff5@test.com', password: hash('1234'), role: 'staff', dept: 'Platform' },
    { name: 'Emily Kang', email: 'staff6@test.com', password: hash('1234'), role: 'staff', dept: 'Platform' },
    { name: 'David Oh', email: 'leader1@test.com', password: hash('1234'), role: 'leader', dept: 'Digital Business' },
    { name: 'James Han', email: 'leader2@test.com', password: hash('1234'), role: 'leader', dept: 'AI Solutions' },
    { name: 'Chris Yoon', email: 'leader3@test.com', password: hash('1234'), role: 'leader', dept: 'Platform' },
    { name: 'Rachel Lim', email: 'strategy@test.com', password: hash('1234'), role: 'strategy', dept: 'Strategy & Planning' },
    { name: 'Andrew Choi', email: 'exec@test.com', password: hash('1234'), role: 'executive', dept: null },
  ];

  for (const u of users) {
    runSql('INSERT INTO users (name, email, password, role, department_id) VALUES (?, ?, ?, ?, ?)',
      [u.name, u.email, u.password, u.role, u.dept ? deptMap[u.dept] : null]);
  }

  const projects = [
    { name: 'Smart Factory MES', dept: 'Digital Business', desc: 'Manufacturing Execution System upgrade' },
    { name: 'Cloud Migration', dept: 'Digital Business', desc: 'On-premise to cloud transition' },
    { name: 'AI Chatbot Service', dept: 'AI Solutions', desc: 'Customer support AI chatbot' },
    { name: 'Video Analytics', dept: 'AI Solutions', desc: 'CCTV video AI analysis system' },
    { name: 'Data Platform', dept: 'Platform', desc: 'Unified data management platform' },
    { name: 'API Gateway', dept: 'Platform', desc: 'API management and monitoring' },
  ];

  for (const p of projects) {
    runSql('INSERT INTO projects (name, department_id, description) VALUES (?, ?, ?)',
      [p.name, deptMap[p.dept], p.desc]);
  }

  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d) => d.toISOString().split('T')[0];

  const strategyUser = queryOne("SELECT id FROM users WHERE role = 'strategy' LIMIT 1");
  runSql('INSERT INTO cycles (title, start_date, end_date, frequency, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [`Weekly Report — ${fmt(monday)}`, fmt(monday), fmt(friday), 'weekly', 'collecting', strategyUser.id]);

  saveDB();

  console.log('Seed data created successfully.\n');
  console.log('Test accounts:');
  console.log('  Staff:     staff1@test.com ~ staff6@test.com (pw: 1234)');
  console.log('  Leaders:   leader1@test.com ~ leader3@test.com (pw: 1234)');
  console.log('  Strategy:  strategy@test.com (pw: 1234)');
  console.log('  Executive: exec@test.com (pw: 1234)');

  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
