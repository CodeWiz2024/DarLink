// Import: import mysql from 'mysql2/promise';
import mysql from 'mysql2/promise';
// Import: import fs from 'fs';
import fs from 'fs';

// Constant: const connection = await mysql.createConnection({
const connection = await mysql.createConnection({
  // L5: host: 'ballast.proxy.rlwy.net',
  host: 'ballast.proxy.rlwy.net',
  // L6: port: 47174,
  port: 47174,
  // L7: user: 'root',
  user: 'root',
  // L8: password: 'GloBeXMiZgoCzqqTAsCUscpRUwhYGejf',
  password: 'GloBeXMiZgoCzqqTAsCUscpRUwhYGejf',
  // L9: database: 'railway',
  database: 'railway',
  // L10: multipleStatements: true
  multipleStatements: true
// End handler/callback
});

// Constant: const sql = fs.readFileSync('database.sql', 'utf8');
const sql = fs.readFileSync('database.sql', 'utf8');
// Await: await connection.query(sql);
await connection.query(sql);
// Console: console.log('✅ Database imported successfully!');
console.log('✅ Database imported successfully!');
// Await: await connection.end();
await connection.end();