const Database = require('better-sqlite3');
const db = new Database('dashboard.db');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    icon TEXT,
    path TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS widgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    config TEXT,
    position_x INTEGER,
    position_y INTEGER,
    width INTEGER,
    height INTEGER
  );
`);

// Insert some initial menu items if the table is empty
const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();
if (menuCount.count === 0) {
  const insert = db.prepare('INSERT INTO menu_items (title, icon, path) VALUES (?, ?, ?)');
  insert.run('Dashboard', 'dashboard', '/');
  insert.run('Leaderboard', 'leaderboard', '/leaderboard');
  insert.run('Orders', 'shopping_cart', '/orders');
  insert.run('Products', 'inventory', '/products');
  insert.run('Sales Report', 'assessment', '/sales');
  insert.run('Messages', 'message', '/messages');
  insert.run('Settings', 'settings', '/settings');
}

module.exports = db;
