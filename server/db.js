const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'reporting.db');
const IS_SERVERLESS = !!process.env.VERCEL;

let db = null;
let SQL = null;
let saveTimer = null;

function saveDB() {
  if (db && !IS_SERVERLESS) {
    try {
      const data = db.export();
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch { /* ignore write errors in readonly environments */ }
  }
}

async function getDB() {
  if (db) return db;
  if (!SQL) SQL = await initSqlJs();

  if (!IS_SERVERLESS) {
    try {
      if (fs.existsSync(DB_PATH)) {
        db = new SQL.Database(fs.readFileSync(DB_PATH));
        db.run('PRAGMA foreign_keys = ON');
        if (!saveTimer) {
          saveTimer = setInterval(saveDB, 5000);
          saveTimer.unref?.();
          process.on('exit', saveDB);
        }
        return db;
      }
    } catch { /* fall through to create new */ }
  }

  db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');

  if (!IS_SERVERLESS && !saveTimer) {
    saveTimer = setInterval(saveDB, 5000);
    saveTimer.unref?.();
    process.on('exit', saveDB);
  }

  return db;
}

async function initDB() {
  const database = await getDB();

  database.run(`CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('staff','leader','strategy','executive')),
    department_id INTEGER REFERENCES departments(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, department_id INTEGER NOT NULL REFERENCES departments(id),
    description TEXT, status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','on_hold')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'weekly' CHECK(frequency IN ('weekly','biweekly')),
    status TEXT DEFAULT 'open' CHECK(status IN ('open','collecting','summarizing','reviewing','closed')),
    created_by INTEGER REFERENCES users(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT, cycle_id INTEGER NOT NULL REFERENCES cycles(id),
    project_id INTEGER NOT NULL REFERENCES projects(id), submitted_by INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL, key_achievements TEXT, issues TEXT, next_plans TEXT, progress_percent INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','submitted','revision_requested')),
    submitted_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS team_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT, cycle_id INTEGER NOT NULL REFERENCES cycles(id),
    department_id INTEGER NOT NULL REFERENCES departments(id), summarized_by INTEGER NOT NULL REFERENCES users(id),
    summary_content TEXT NOT NULL, key_points TEXT, risk_items TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','submitted','revision_requested')),
    submitted_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cycle_id, department_id)
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS executive_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT, cycle_id INTEGER NOT NULL REFERENCES cycles(id),
    prepared_by INTEGER NOT NULL REFERENCES users(id), overall_summary TEXT NOT NULL, highlights TEXT,
    risks_and_issues TEXT, decisions_needed TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','submitted','reviewed')),
    submitted_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cycle_id)
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT, target_type TEXT NOT NULL CHECK(target_type IN ('report','team_summary','executive_report')),
    target_id INTEGER NOT NULL, from_user_id INTEGER NOT NULL REFERENCES users(id),
    to_user_id INTEGER NOT NULL REFERENCES users(id), content TEXT NOT NULL, is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, cycle_id INTEGER NOT NULL REFERENCES cycles(id),
    target_user_id INTEGER NOT NULL REFERENCES users(id), message TEXT NOT NULL,
    reminder_type TEXT NOT NULL CHECK(reminder_type IN ('submit','summarize','review')),
    is_read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const hasUsers = queryOne('SELECT COUNT(*) as c FROM users');
  if (!hasUsers || hasUsers.c === 0) {
    seedData();
  }

  saveDB();
  return database;
}

function seedData() {
  const bcrypt = require('bcryptjs');
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const depts = ['Digital Business', 'AI Solutions', 'Platform', 'Strategy & Planning'];
  for (const name of depts) runSql('INSERT OR IGNORE INTO departments (name) VALUES (?)', [name]);

  const deptRows = queryAll('SELECT * FROM departments');
  const dm = {};
  for (const d of deptRows) dm[d.name] = d.id;

  const users = [
    ['John Kim', 'staff1@test.com', 'staff', 'Digital Business'],
    ['Sarah Lee', 'staff2@test.com', 'staff', 'Digital Business'],
    ['Mike Park', 'staff3@test.com', 'staff', 'AI Solutions'],
    ['Hannah Jung', 'staff4@test.com', 'staff', 'AI Solutions'],
    ['Daniel Choi', 'staff5@test.com', 'staff', 'Platform'],
    ['Emily Kang', 'staff6@test.com', 'staff', 'Platform'],
    ['David Oh', 'leader1@test.com', 'leader', 'Digital Business'],
    ['James Han', 'leader2@test.com', 'leader', 'AI Solutions'],
    ['Chris Yoon', 'leader3@test.com', 'leader', 'Platform'],
    ['Rachel Lim', 'strategy@test.com', 'strategy', 'Strategy & Planning'],
    ['Andrew Choi', 'exec@test.com', 'executive', null],
  ];
  const pw = hash('1234');
  for (const [name, email, role, dept] of users) {
    runSql('INSERT OR IGNORE INTO users (name,email,password,role,department_id) VALUES (?,?,?,?,?)',
      [name, email, pw, role, dept ? dm[dept] : null]);
  }

  const projects = [
    ['Smart Factory MES', 'Digital Business', 'Manufacturing Execution System upgrade'],
    ['Cloud Migration', 'Digital Business', 'On-premise to cloud transition'],
    ['AI Chatbot Service', 'AI Solutions', 'Customer support AI chatbot'],
    ['Video Analytics', 'AI Solutions', 'CCTV video AI analysis system'],
    ['Data Platform', 'Platform', 'Unified data management platform'],
    ['API Gateway', 'Platform', 'API management and monitoring'],
  ];
  for (const [name, dept, desc] of projects) {
    runSql('INSERT OR IGNORE INTO projects (name,department_id,description) VALUES (?,?,?)', [name, dm[dept], desc]);
  }

  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d) => d.toISOString().split('T')[0];

  const su = queryOne("SELECT id FROM users WHERE role='strategy' LIMIT 1");
  if (su) {
    runSql('INSERT INTO cycles (title,start_date,end_date,frequency,status,created_by) VALUES (?,?,?,?,?,?)',
      [`Weekly Report — ${fmt(monday)}`, fmt(monday), fmt(friday), 'weekly', 'collecting', su.id]);
  }
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length ? rows[0] : null;
}

function runSql(sql, params = []) {
  db.run(sql, params);
  const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0];
  const changes = db.getRowsModified();
  if (!IS_SERVERLESS) saveDB();
  return { lastInsertRowid: lastId, changes };
}

module.exports = { getDB, initDB, queryAll, queryOne, runSql, saveDB };
