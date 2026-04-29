const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

async function main() {
  const dbPath = path.join(__dirname, 'data', 'imagehosting.db');
  const SQL = await initSqlJs();
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  // Generate new hash for admin123
  const hash = await bcrypt.hash('admin123', 10);
  console.log('New hash for admin123:', hash);

  // Update password
  db.run("UPDATE admins SET password = ? WHERE username = 'admin'", [hash]);

  // Verify
  const result = db.exec("SELECT password FROM admins WHERE username = 'admin'");
  const savedHash = result[0]?.values[0]?.[0];
  console.log('Saved hash:', savedHash);

  const verify = await bcrypt.compare('admin123', savedHash);
  console.log('Verify admin123 matches?', verify);

  // Save
  const buffer = Buffer.from(db.export());
  fs.writeFileSync(dbPath, buffer);
  console.log('Database updated and saved');

  db.close();
}

main();
