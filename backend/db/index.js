const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || (
	process.env.NODE_ENV === 'production'
		? '/app/data/shqiponja.db'
		: path.join(__dirname, '..', 'data', 'shqiponja.db')
);

// Ensure data directory exists
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

console.log(`[DB] Using SQLite at: ${DB_PATH}`);

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
