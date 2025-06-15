import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
const dbPath = path.join(__dirname, 'neurom.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('DB: Failed to connect to SQLite:', err.message);
    process.exit(1);
  }
  console.log('DB: Connected to SQLite database at', dbPath);
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

// Create tables
const initTables = () => {
  // Users table: stores user data with INTEGER id
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      morph_id TEXT NOT NULL UNIQUE,
      current_skel INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('DB: Error creating users table:', err.message);
    else console.log('DB: Users table initialized');
  });

  // Morph_ops table: stores morph operations (MES mailbox)
  db.run(`
    CREATE TABLE IF NOT EXISTS morph_ops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      intent TEXT NOT NULL CHECK (intent IN ('PUSH', 'PULL')),
      value INTEGER NOT NULL CHECK (value >= 0),
      target_id INTEGER NOT NULL,
      signature TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      morph_id TEXT UNIQUE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (target_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error('DB: Error creating morph_ops table:', err.message);
    else console.log('DB: Morph_ops table initialized');
  });

  // Peers table: stores peer connections for P2P mesh
  db.run(`
    CREATE TABLE IF NOT EXISTS peers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      peer_id TEXT NOT NULL UNIQUE,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error('DB: Error creating peers table:', err.message);
    else console.log('DB: Peers table initialized');
  });
};

// Initialize database
initTables();

// Export database connection
export default db;

// Close database on process exit
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('DB: Error closing database:', err.message);
    console.log('DB: Database connection closed');
    process.exit(0);
  });
});