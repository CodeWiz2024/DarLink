import mysql from 'mysql2/promise';
import fs from 'fs';

const connection = await mysql.createConnection({
  host: 'ballast.proxy.rlwy.net',
  port: 47174,
  user: 'root',
  password: 'GloBeXMiZgoCzqqTAsCUscpRUwhYGejf',
  database: 'railway',
  multipleStatements: true
});

const sql = fs.readFileSync('database.sql', 'utf8');
await connection.query(sql);
console.log('✅ Database imported successfully!');
await connection.end();