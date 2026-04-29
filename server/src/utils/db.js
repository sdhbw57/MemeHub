const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data', 'imagehosting.db');
const dbDir = path.join(__dirname, '../../data');

let db = null;
let SQL = null;

function loadDbData() {
  try {
    if (fs.existsSync(dbPath)) {
      return fs.readFileSync(dbPath);
    }
  } catch (err) {
    return new Uint8Array(0);
  }
}

function saveDbData() {
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to save database:', err.message);
  }
}

async function getDb() {
  if (!db) {
    if (!SQL) {
      SQL = await initSqlJs();
    }
    const dbData = loadDbData();
    try {
      db = new SQL.Database(dbData);
    } catch (err) {
      db = new SQL.Database();
    }
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA synchronous = NORMAL');
    db.run('PRAGMA foreign_keys = ON');
    db.run('PRAGMA cache_size = -64000');
  }
  return db;
}

async function query(sql, params = []) {
  const database = await getDb();
  try {
    if (params && params.length > 0) {
      const stmt = database.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } else {
      const result = database.exec(sql);
      if (result.length === 0) return [];
      const columns = result[0].columns;
      return result[0].values.map((row) => {
        const obj = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });
    }
  } finally {
    saveDbData();
  }
}

async function execute(sql, params = []) {
  const database = await getDb();
  try {
    if (params && params.length > 0) {
      database.run(sql, params);
    } else {
      database.run(sql);
    }
    return { changes: database.getRowsModified() };
  } finally {
    saveDbData();
  }
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function runScript(sql) {
  const database = await getDb();
  try {
    database.exec(sql);
  } finally {
    saveDbData();
  }
}

function close() {
  if (db) {
    saveDbData();
    db.close();
    db = null;
  }
}

module.exports = {
  getDb,
  query,
  execute,
  queryOne,
  runScript,
  close,
};
