const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

async function main() {
  const dbPath = path.join(__dirname, 'data', 'imagehosting.db');
  
  if (!fs.existsSync(dbPath)) {
    console.log('Database not found at:', dbPath);
    return;
  }

  const SQL = await initSqlJs();
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  const result = db.exec("SELECT id, username, password, role FROM admins WHERE username = 'admin'");
  
  if (result.length === 0 || result[0].values.length === 0) {
    console.log('No admin user found');
    return;
  }

  const row = result[0].values[0];
  const cols = result[0].columns;
  const admin = {};
  cols.forEach((col, i) => admin[col] = row[i]);
  
  console.log('Admin from DB:', { id: admin.id, username: admin.username, role: admin.role });
  console.log('Password hash:', admin.password);
  
  // Test password
  const testPassword = 'admin123';
  const isValid = await bcrypt.compare(testPassword, admin.password);
  console.log(`Does '${testPassword}' match?`, isValid);
  
  db.close();
}

main();
