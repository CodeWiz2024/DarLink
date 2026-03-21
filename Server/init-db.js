// Server/init-db.js
// Reads database.sql from the repo root and initialises the VacationRentalDB
// schema on first run.  Safe to call on every restart – it checks whether the
// tables already exist and skips creation when they do.

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// database.sql lives one level above the Server/ directory (repo root)
const SQL_FILE_PATH = path.join(__dirname, '..', 'database.sql');
const DB_NAME = 'VacationRentalDB';

/**
 * Parse the raw SQL file into an array of individual statements that
 * mysql2 can execute one at a time.
 *
 * Handles:
 *  - DELIMITER // … DELIMITER ; blocks (triggers, stored procedures)
 *  - Standard semicolon-terminated statements
 *  - Single-line (--) and block (/* … *\/) comments are preserved but
 *    DELIMITER directives themselves are stripped.
 */
function parseSqlStatements(sql) {
  const statements = [];
  let delimiter = ';';
  let current = '';

  // Split on newlines so we can detect DELIMITER directives line-by-line
  const lines = sql.split('\n');

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Detect DELIMITER directive (e.g. "DELIMITER //" or "DELIMITER ;")
    const delimiterMatch = trimmed.match(/^DELIMITER\s+(\S+)/i);
    if (delimiterMatch) {
      // Flush whatever we have accumulated before the delimiter change
      const flushed = current.trim();
      if (flushed) {
        statements.push(flushed);
        current = '';
      }
      delimiter = delimiterMatch[1];
      continue; // do not add the DELIMITER line itself to any statement
    }

    current += rawLine + '\n';

    // Check whether the accumulated text ends with the current delimiter
    if (current.trimEnd().endsWith(delimiter)) {
      let stmt = current.trim();

      // If delimiter is not the default semicolon, strip the custom delimiter
      // from the end and ensure the statement ends with a semicolon so that
      // mysql2 accepts it.
      if (delimiter !== ';') {
        stmt = stmt.slice(0, stmt.lastIndexOf(delimiter)).trimEnd();
        if (!stmt.endsWith(';')) {
          stmt += ';';
        }
      }

      if (stmt && stmt !== ';') {
        statements.push(stmt);
      }
      current = '';
    }
  }

  // Flush any remaining content
  const remaining = current.trim();
  if (remaining && remaining !== ';') {
    statements.push(remaining);
  }

  return statements;
}

/**
 * Returns true when the VacationRentalDB database already contains at least
 * the core tables we depend on, meaning the schema has been initialised
 * previously and we can skip re-running the DDL.
 */
async function schemaAlreadyExists(connection) {
  try {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS cnt
       FROM information_schema.tables
       WHERE table_schema = ?
         AND table_name IN ('USER_a', 'Property', 'Booking', 'benefits_from')`,
      [DB_NAME]
    );
    return rows[0].cnt >= 4;
  } catch {
    return false;
  }
}

/**
 * Main initialisation function.
 * Connects to MySQL (without selecting a database), checks whether the schema
 * already exists, and if not reads + executes database.sql to create it.
 *
 * Never throws – errors are logged and the app continues so that a DB
 * misconfiguration does not prevent the process from starting.
 */
export async function initDatabase() {
  let connection;

  try {
    // Connect without specifying a database so we can CREATE DATABASE if needed
    connection = await mysql.createConnection({
      host: process.env.HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306,
      multipleStatements: false, // we execute statements one at a time
    });

    console.log('🔌 DB init: connected to MySQL server');

    // ------------------------------------------------------------------
    // Fast-path: if the schema is already in place, do nothing
    // ------------------------------------------------------------------
    if (await schemaAlreadyExists(connection)) {
      console.log(`✅ DB init: schema already exists in ${DB_NAME} – skipping`);
      return;
    }

    // ------------------------------------------------------------------
    // Read the SQL file
    // ------------------------------------------------------------------
    if (!fs.existsSync(SQL_FILE_PATH)) {
      console.error(`❌ DB init: SQL file not found at ${SQL_FILE_PATH}`);
      return;
    }

    const rawSql = fs.readFileSync(SQL_FILE_PATH, 'utf8');
    console.log(`📄 DB init: read ${SQL_FILE_PATH}`);

    // ------------------------------------------------------------------
    // Parse into individual statements, skipping the DROP DATABASE line
    // so we never accidentally wipe an existing database on restart.
    // ------------------------------------------------------------------
    const allStatements = parseSqlStatements(rawSql);

    const statements = allStatements.filter((stmt) => {
      const upper = stmt.toUpperCase().trim();
      // Skip DROP DATABASE – we never want to destroy existing data
      if (upper.startsWith('DROP DATABASE')) return false;
      // Skip the trailing UPDATE on specific PromotionIds (seed-data only)
      return true;
    });

    console.log(`🗂️  DB init: executing ${statements.length} SQL statements…`);

    let executed = 0;
    let skipped = 0;

    for (const stmt of statements) {
      const upper = stmt.toUpperCase().trim();

      // Skip empty or comment-only statements
      if (!upper || upper.startsWith('--') || upper.startsWith('/*')) {
        skipped++;
        continue;
      }

      try {
        await connection.query(stmt);
        executed++;
      } catch (err) {
        // Tolerate "already exists" errors so the script is idempotent
        if (
          err.code === 'ER_DB_CREATE_EXISTS' ||   // database already exists
          err.code === 'ER_TABLE_EXISTS_ERROR' ||  // table already exists
          err.code === 'ER_DUP_KEYNAME' ||         // index already exists
          err.code === 'ER_TRG_ALREADY_EXISTS' ||  // trigger already exists
          err.code === 'ER_SP_ALREADY_EXISTS' ||   // procedure already exists
          err.code === 'ER_DUP_ENTRY'              // duplicate seed-data row
        ) {
          skipped++;
        } else {
          // Log unexpected errors but keep going so one bad statement
          // doesn't abort the whole initialisation
          console.warn(
            `⚠️  DB init: skipping statement due to error [${err.code}]: ${err.message}`
          );
          console.warn(`   Statement: ${stmt.slice(0, 120)}…`);
          skipped++;
        }
      }
    }

    console.log(
      `✅ DB init: done – ${executed} executed, ${skipped} skipped`
    );
  } catch (err) {
    // Top-level failure (e.g. cannot connect) – log and let the app continue
    console.error('❌ DB init: initialisation failed:', err.message);
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // ignore close errors
      }
    }
  }
}
