import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Use absolute path for database file
const dbPath = path.join(process.cwd(), 'dashboard.db');

// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create new database connection
const db = new Database(dbPath);

// Initialize database schema if tables don't exist
const initializeDatabase = () => {
  console.log('Initializing database at:', dbPath);
  
  try {
    // Check if tables exist
    const tablesExist = db.prepare(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' AND (
        name='menu_items' OR 
        name='apis' OR 
        name='widgets' OR
        name='sales' OR
        name='products' OR
        name='pie_data'
      )
    `).all();

    const existingTables = new Set(tablesExist.map(t => t.name));
    console.log('Existing tables:', existingTables);

    // Create tables if they don't exist
    if (!existingTables.has('menu_items')) {
      console.log('Creating menu_items table...');
      db.prepare(`
        CREATE TABLE IF NOT EXISTS menu_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          path TEXT NOT NULL,
          icon TEXT
        )
      `).run();
    }

    if (!existingTables.has('sales')) {
      console.log('Creating sales table...');
      db.prepare(`
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          month TEXT NOT NULL,
          value INTEGER NOT NULL
        )
      `).run();

      // Insert sample sales data
      console.log('Inserting sample sales data...');
      const sampleSales = [
        { month: '1월', value: 4000 },
        { month: '2월', value: 3000 },
        { month: '3월', value: 2000 },
        { month: '4월', value: 2780 },
        { month: '5월', value: 1890 },
        { month: '6월', value: 2390 }
      ];
      
      const insertSales = db.prepare('INSERT INTO sales (month, value) VALUES (?, ?)');
      sampleSales.forEach(sale => {
        insertSales.run(sale.month, sale.value);
      });
    }

    if (!existingTables.has('products')) {
      console.log('Creating products table...');
      db.prepare(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          value INTEGER NOT NULL
        )
      `).run();

      // Insert sample products data
      console.log('Inserting sample products data...');
      const sampleProducts = [
        { name: '노트북', value: 1200000 },
        { name: '스마트폰', value: 800000 },
        { name: '태블릿', value: 600000 },
        { name: '이어폰', value: 200000 }
      ];
      
      const insertProduct = db.prepare('INSERT INTO products (name, value) VALUES (?, ?)');
      sampleProducts.forEach(product => {
        insertProduct.run(product.name, product.value);
      });
    }

    if (!existingTables.has('pie_data')) {
      console.log('Creating pie_data table...');
      db.prepare(`
        CREATE TABLE IF NOT EXISTS pie_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          value INTEGER NOT NULL
        )
      `).run();

      // Insert sample pie data
      console.log('Inserting sample pie data...');
      const samplePieData = [
        { name: '제품A', value: 400 },
        { name: '제품B', value: 300 },
        { name: '제품C', value: 300 },
        { name: '제품D', value: 200 }
      ];
      
      const insertPieData = db.prepare('INSERT INTO pie_data (name, value) VALUES (?, ?)');
      samplePieData.forEach(item => {
        insertPieData.run(item.name, item.value);
      });
    }

    if (!existingTables.has('apis')) {
      console.log('Creating apis table...');
      db.prepare(`
        CREATE TABLE IF NOT EXISTS apis (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL CHECK(type IN ('internal', 'external')),
          endpoint TEXT NOT NULL,
          method TEXT DEFAULT 'GET',
          query TEXT,
          headers TEXT,
          body TEXT
        )
      `).run();

      // Insert sample APIs
      console.log('Inserting sample APIs...');
      const sampleApis = [
        {
          name: 'Sample Sales Data',
          description: 'Monthly sales data for demonstration',
          type: 'internal',
          endpoint: 'sales',
          method: 'GET',
          query: 'SELECT month as name, value FROM sales'
        },
        {
          name: 'Sample Products',
          description: 'Product inventory data',
          type: 'internal',
          endpoint: 'products',
          method: 'GET',
          query: 'SELECT name, value FROM products'
        },
        {
          name: 'Sample Pie Data',
          description: 'Sample data for pie charts',
          type: 'internal',
          endpoint: 'pie',
          method: 'GET',
          query: 'SELECT name, value FROM pie_data'
        }
      ];

      const insertApi = db.prepare('INSERT INTO apis (name, description, type, endpoint, method, query) VALUES (?, ?, ?, ?, ?, ?)');
      sampleApis.forEach(api => {
        insertApi.run(api.name, api.description, api.type, api.endpoint, api.method, api.query);
      });

      db.prepare(`
        INSERT OR REPLACE INTO apis (id, name, description, type, endpoint, method, query, headers, body)
        VALUES 
          (4, '상품 데이터', '상품 판매 데이터', 'internal', '/api/sample/products', 'GET', '', '', '')
      `).run();
    }

    if (!existingTables.has('widgets')) {
      console.log('Creating widgets table...');
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

      // Insert sample widgets if apis table exists and has data
      console.log('Inserting sample widgets...');
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
        },
        {
          title: 'Product Inventory',
          type: 'table',
          widget_type: 'table',
          api_id: 2,
          data_path: 'data',
          position_x: 6,
          position_y: 0,
          width: 6,
          height: 4
        },
        {
          title: 'Sales Distribution',
          type: 'chart',
          widget_type: 'chart',
          chart_type: 'pie',
          api_id: 3,
          data_path: 'data',
          position_x: 0,
          position_y: 4,
          width: 4,
          height: 4
        }
      ];

      const insertWidget = db.prepare(`
        INSERT INTO widgets (
          title, type, widget_type, chart_type, api_id, 
          data_path, position_x, position_y, width, height
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
    }

    if (!existingTables.has('menu_items')) {
      // Insert default menu items
      console.log('Inserting default menu items...');
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
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Function to reset tables and insert sample data
const resetTables = () => {
  console.log('Resetting tables...');
  
  // Drop existing tables
  ['pie_data', 'products', 'sales'].forEach(table => {
    db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
    console.log(`Dropped ${table} table`);
  });

  // Create and populate sales table
  db.prepare(`
    CREATE TABLE sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      value INTEGER NOT NULL
    )
  `).run();
  
  const sampleSales = [
    { month: '1월', value: 4000 },
    { month: '2월', value: 3000 },
    { month: '3월', value: 2000 },
    { month: '4월', value: 2780 },
    { month: '5월', value: 1890 },
    { month: '6월', value: 2390 }
  ];
  
  const insertSales = db.prepare('INSERT INTO sales (month, value) VALUES (?, ?)');
  sampleSales.forEach(sale => {
    insertSales.run(sale.month, sale.value);
  });

  // Create and populate products table
  db.prepare(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value INTEGER NOT NULL
    )
  `).run();

  const sampleProducts = [
    { name: '노트북', value: 1200000 },
    { name: '스마트폰', value: 800000 },
    { name: '태블릿', value: 600000 },
    { name: '이어폰', value: 200000 }
  ];
  
  const insertProduct = db.prepare('INSERT INTO products (name, value) VALUES (?, ?)');
  sampleProducts.forEach(product => {
    insertProduct.run(product.name, product.value);
  });

  // Create and populate pie_data table
  db.prepare(`
    CREATE TABLE pie_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value INTEGER NOT NULL
    )
  `).run();

  const samplePieData = [
    { name: 'Group A', value: 400 },
    { name: 'Group B', value: 300 },
    { name: 'Group C', value: 300 },
    { name: 'Group D', value: 200 }
  ];
  
  const insertPieData = db.prepare('INSERT INTO pie_data (name, value) VALUES (?, ?)');
  samplePieData.forEach(item => {
    insertPieData.run(item.name, item.value);
  });

  console.log('Tables reset and sample data inserted successfully');
};

// Function to reset menu items
const resetMenuItems = () => {
  console.log('Resetting menu items...');
  
  // Drop and recreate menu_items table
  db.prepare('DROP TABLE IF EXISTS menu_items').run();
  
  db.prepare(`
    CREATE TABLE menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      path TEXT NOT NULL,
      icon TEXT
    )
  `).run();

  // Insert basic menu items
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

  console.log('Menu items reset successfully');
};

// Function to reset APIs and Widgets
const resetApisAndWidgets = () => {
  console.log('Resetting APIs and Widgets...');
  
  // Drop tables in correct order (widgets first, then apis)
  db.prepare('DROP TABLE IF EXISTS widgets').run();
  db.prepare('DROP TABLE IF EXISTS apis').run();
  
  // Recreate and populate apis table
  db.prepare(`
    CREATE TABLE apis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('internal', 'external')),
      endpoint TEXT NOT NULL,
      method TEXT DEFAULT 'GET',
      query TEXT,
      headers TEXT,
      body TEXT
    )
  `).run();

  // Insert sample APIs
  const sampleApis = [
    {
      name: 'Sample Sales Data',
      description: 'Monthly sales data for demonstration',
      type: 'internal',
      endpoint: 'sales',
      method: 'GET',
      query: 'SELECT month as name, value FROM sales'
    },
    {
      name: 'Sample Products',
      description: 'Product inventory data',
      type: 'internal',
      endpoint: 'products',
      method: 'GET',
      query: 'SELECT name, value FROM products'
    },
    {
      name: 'Sample Pie Data',
      description: 'Sample data for pie charts',
      type: 'internal',
      endpoint: 'pie',
      method: 'GET',
      query: 'SELECT name, value FROM pie_data'
    }
  ];

  const insertApi = db.prepare('INSERT INTO apis (name, description, type, endpoint, method, query) VALUES (?, ?, ?, ?, ?, ?)');
  sampleApis.forEach(api => {
    insertApi.run(api.name, api.description, api.type, api.endpoint, api.method, api.query);
  });

  db.prepare(`
    INSERT OR REPLACE INTO apis (id, name, description, type, endpoint, method, query, headers, body)
    VALUES 
      (4, '상품 데이터', '상품 판매 데이터', 'internal', '/api/sample/products', 'GET', '', '', '')
  `).run();

  // Recreate and populate widgets table
  db.prepare(`
    CREATE TABLE widgets (
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
    },
    {
      title: 'Product Inventory',
      type: 'table',
      widget_type: 'table',
      api_id: 2,
      data_path: 'data',
      position_x: 6,
      position_y: 0,
      width: 6,
      height: 4
    },
    {
      title: 'Sales Distribution',
      type: 'chart',
      widget_type: 'chart',
      chart_type: 'pie',
      api_id: 3,
      data_path: 'data',
      position_x: 0,
      position_y: 4,
      width: 4,
      height: 4
    }
  ];

  const insertWidget = db.prepare(`
    INSERT INTO widgets (
      title, type, widget_type, chart_type, api_id, 
      data_path, position_x, position_y, width, height
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

  console.log('APIs and Widgets reset successfully');
};

// Initialize database
initializeDatabase();

// Reset menu items
resetMenuItems();

// Reset APIs and Widgets together
resetApisAndWidgets();

// Reset tables and insert sample data
// 필요시
resetTables();

// Enable foreign keys
db.pragma('foreign_keys = ON');

export default db;
