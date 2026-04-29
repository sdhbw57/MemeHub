const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'imagehosting.db');

async function main() {
  const SQL = await initSqlJs();
  let db;

  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath);
    db = new SQL.Database(data);
  } else {
    console.log('Database not found');
    return;
  }

  // Check current password
  const result = db.exec("SELECT password FROM admins WHERE username = 'admin'");
  console.log('Current password hash:', result[0]?.values[0]?.[0]);

  // Test bcrypt
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('admin123', 10);
  console.log('New hash:', hash);

  const test = await bcrypt.compare('admin123', result[0]?.values[0]?.[0]);
  console.log('Old hash matches admin123?', test);

  // Update password
  db.run("UPDATE admins SET password = ? WHERE username = 'admin'", [hash]);

  // Verify
  const newResult = db.exec("SELECT password FROM admins WHERE username = 'admin'");
  const newHash = newResult[0]?.values[0]?.[0];
  console.log('New password hash:', newHash);

  const verify = await bcrypt.compare('admin123', newHash);
  console.log('New hash matches admin123?', verify);

  // Save
  const buffer = Buffer.from(db.export());
  fs.writeFileSync(dbPath, buffer);
  console.log('Database saved');

  db.close();
}

main();
