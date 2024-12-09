import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Create new database if it doesn't exist
const dbPath = 'dashboard.db';
const db = new Database(dbPath);

// Initialize database schema if tables don't exist
const initializeDatabase = () => {
  // Check if tables exist
  const tablesExist = db.prepare(`
    SELECT name 
    FROM sqlite_master 
    WHERE type='table' AND (
      name='menu_items' OR 
      name='apis' OR 
      name='widgets'
    )
  `).all();

  if (tablesExist.length === 3) {
    return; // Database is already initialized
  }

  // Create tables
  db.prepare(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      path TEXT NOT NULL,
      icon TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS apis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      endpoint TEXT NOT NULL,
      method TEXT DEFAULT 'GET',
      headers TEXT,
      body TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS widgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('chart', 'table', 'value')),
      widget_type TEXT NOT NULL,
      chart_type TEXT CHECK(chart_type IN ('line', 'bar', 'pie', 'doughnut', 'radar', 'polarArea') OR chart_type IS NULL),
      api_id INTEGER,
      data_path TEXT,
      refresh_interval INTEGER DEFAULT 60000,
      position_x INTEGER DEFAULT 0,
      position_y INTEGER DEFAULT 0,
      width INTEGER DEFAULT 2,
      height INTEGER DEFAULT 2,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (api_id) REFERENCES apis (id),
      CHECK ((type = 'chart' AND chart_type IS NOT NULL) OR (type != 'chart' AND chart_type IS NULL))
    )
  `).run();

  // Insert default menu items
  const menuItems = [
    { title: 'Dashboard', path: '/', icon: 'Dashboard' },
    { title: 'Settings', path: '/settings', icon: 'Settings' },
    { title: 'Analytics', path: '/analytics', icon: 'Analytics' },
    { title: 'Reports', path: '/reports', icon: 'Assessment' },
    { title: 'Users', path: '/users', icon: 'People' },
    { title: 'Notifications', path: '/notifications', icon: 'Notifications' },
    { title: 'Profile', path: '/profile', icon: 'Person' }
  ];

  const insertMenuItem = db.prepare('INSERT INTO menu_items (title, path, icon) VALUES (?, ?, ?)');
  menuItems.forEach(item => {
    insertMenuItem.run(item.title, item.path, item.icon);
  });

  // Insert sample APIs
  const sampleApis = [
    {
      name: 'Sample Sales Data',
      description: 'Monthly sales data for demonstration',
      endpoint: 'http://localhost:3001/api/sample/sales',
      method: 'GET'
    },
    {
      name: 'Sample Products',
      description: 'Product inventory data',
      endpoint: 'http://localhost:3001/api/sample/products',
      method: 'GET'
    },
    {
      name: 'Sample Pie Data',
      description: 'Sample data for pie charts',
      endpoint: 'http://localhost:3001/api/sample/pie',
      method: 'GET'
    }
  ];

  const insertApi = db.prepare(`
    INSERT INTO apis (name, description, endpoint, method)
    VALUES (?, ?, ?, ?)
  `);

  sampleApis.forEach(api => {
    insertApi.run(api.name, api.description, api.endpoint, api.method);
  });

  // Insert sample widgets
  const sampleWidgets = [
    {
      title: 'Monthly Sales',
      type: 'chart',
      widget_type: 'chart',
      chart_type: 'line',
      api_id: 1,
      data_path: 'data',
      position_x: 0,
      position_y: 0,
      width: 6,
      height: 4
    }
  ];

  const insertWidget = db.prepare(`
    INSERT INTO widgets (
      title, type, widget_type, chart_type, api_id, data_path,
      position_x, position_y, width, height
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sampleWidgets.forEach(widget => {
    insertWidget.run(
      widget.title,
      widget.type,
      widget.widget_type,
      widget.chart_type,
      widget.api_id,
      widget.data_path,
      widget.position_x,
      widget.position_y,
      widget.width,
      widget.height
    );
  });
};

// Initialize database
initializeDatabase();

export default db;
