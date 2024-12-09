const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// Get menu items
app.get('/api/menu', (req, res) => {
  const menuItems = db.prepare('SELECT * FROM menu_items').all();
  res.json(menuItems);
});

// Get widgets
app.get('/api/widgets', (req, res) => {
  const widgets = db.prepare('SELECT * FROM widgets').all();
  res.json(widgets);
});

// Update widget position and size
app.put('/api/widgets/:id', (req, res) => {
  const { id } = req.params;
  const { position_x, position_y, width, height } = req.body;
  
  db.prepare(`
    UPDATE widgets 
    SET position_x = ?, position_y = ?, width = ?, height = ?
    WHERE id = ?
  `).run(position_x, position_y, width, height, id);
  
  res.json({ success: true });
});

// Add new widget
app.post('/api/widgets', (req, res) => {
  const { title, type, config } = req.body;
  const result = db.prepare(`
    INSERT INTO widgets (title, type, config, position_x, position_y, width, height)
    VALUES (?, ?, ?, 0, 0, 2, 2)
  `).run(title, type, JSON.stringify(config));
  
  res.json({ id: result.lastInsertRowid });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
