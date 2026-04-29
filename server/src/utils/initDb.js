const fs = require('fs');
const path = require('path');
const { getDb } = require('../utils/db');

function initDatabase() {
  const db = getDb();
  const sqlPath = path.join(__dirname, '../database/init.sqlite.sql');

  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      if (statement.toUpperCase().startsWith('SELECT') || statement.toUpperCase().startsWith('PRAGMA')) {
        db.prepare(statement).run();
      } else {
        db.prepare(statement).run();
      }
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    throw err;
  }
}

module.exports = initDatabase;
