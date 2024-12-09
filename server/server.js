import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import Database from 'better-sqlite3';
import db from './database.js';

const dbInstance = new Database('dashboard.db');
const app = express();

app.use(cors());
app.use(express.json());

// Sample API endpoints for testing
app.get('/api/sample/sales', (req, res) => {
  const data = [
    { name: '1월', value: 4000 },
    { name: '2월', value: 3000 },
    { name: '3월', value: 2000 },
    { name: '4월', value: 2780 },
    { name: '5월', value: 1890 },
    { name: '6월', value: 2390 },
  ];
  res.json({ data });
});

app.get('/api/sample/products', (req, res) => {
  const data = [
    { id: 1, name: '노트북', value: 1200000 },
    { id: 2, name: '스마트폰', value: 800000 },
    { id: 3, name: '태블릿', value: 600000 },
    { id: 4, name: '이어폰', value: 200000 },
  ];
  res.json({ data });
});

app.get('/api/sample/pie', (req, res) => {
  const data = [
    { name: '제품A', value: 400 },
    { name: '제품B', value: 300 },
    { name: '제품C', value: 300 },
    { name: '제품D', value: 200 },
  ];
  res.json({ data });
});

// Get menu items
app.get('/api/menu', (req, res) => {
  const menuItems = dbInstance.prepare('SELECT * FROM menu_items').all();
  res.json(menuItems);
});

// Get all widgets (including inactive ones) for settings page
app.get('/api/widgets/all', (req, res) => {
  try {
    const widgets = dbInstance.prepare(`
      SELECT 
        widgets.*,
        apis.name as api_name,
        apis.endpoint as api_endpoint
      FROM widgets
      LEFT JOIN apis ON widgets.api_id = apis.id
    `).all();
    res.json(widgets);
  } catch (error) {
    console.error('Error fetching all widgets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active widgets for dashboard
app.get('/api/widgets', (req, res) => {
  try {
    const widgets = dbInstance.prepare(`
      SELECT 
        widgets.*,
        apis.name as api_name,
        apis.endpoint as api_endpoint
      FROM widgets
      LEFT JOIN apis ON widgets.api_id = apis.id
      WHERE widgets.active = 1
    `).all();
    res.json(widgets);
  } catch (error) {
    console.error('Error fetching active widgets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get widget data
app.get('/api/widgets/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    const widget = dbInstance.prepare(`
      SELECT 
        w.*, 
        a.endpoint,
        a.method,
        a.headers,
        a.body 
      FROM widgets w 
      LEFT JOIN apis a ON w.api_id = a.id 
      WHERE w.id = ?
    `).get(id);

    if (!widget) {
      res.status(404).json({ error: 'Widget not found' });
      return;
    }

    // For sample endpoints on this server
    if (widget.endpoint && widget.endpoint.includes('localhost:3001/api/sample/')) {
      const response = await fetch(widget.endpoint);
      const data = await response.json();
      res.json(data);
      return;
    }

    // For external APIs
    if (!widget.endpoint) {
      res.json({ data: null });
      return;
    }

    const headers = widget.headers ? JSON.parse(widget.headers) : {};
    const body = widget.body ? JSON.parse(widget.body) : null;

    const response = await fetch(widget.endpoint, {
      method: widget.method || 'GET',
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();

    // If data_path is specified, try to extract the data
    if (widget.data_path) {
      const paths = widget.data_path.split('.');
      let result = data;
      for (const path of paths) {
        result = result[path];
        if (result === undefined) break;
      }
      res.json({ data: result || null });
    } else {
      res.json({ data: data });
    }
  } catch (error) {
    console.error('Error fetching widget data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle widget activation
app.patch('/api/widgets/:id/toggle', (req, res) => {
  console.log('\n=== Widget Toggle Request ===');
  const { id } = req.params;
  const { active } = req.body;
  
  console.log('Request params:', { id, active });
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  try {
    const newActiveValue = active ? 1 : 0;
    console.log('Converting active status to:', newActiveValue);
    
    // First check if widget exists
    const widget = dbInstance.prepare('SELECT * FROM widgets WHERE id = ?').get(id);
    console.log('Current widget state:', widget);
    
    if (!widget) {
      console.log('Widget not found in database');
      res.status(404).json({ error: 'Widget not found' });
      return;
    }
    
    // Update widget active status
    console.log('Executing update query...');
    const result = dbInstance.prepare('UPDATE widgets SET active = ? WHERE id = ?').run(newActiveValue, id);
    console.log('Update result:', result);
    
    if (result.changes === 0) {
      console.log('No rows were updated');
      res.status(500).json({ error: 'Failed to update widget' });
      return;
    }
    
    // Get updated widget with API info
    console.log('Fetching updated widget data...');
    const updatedWidget = dbInstance.prepare(`
      SELECT 
        w.*,
        a.endpoint as api_endpoint,
        a.name as api_name,
        a.headers as api_headers,
        a.body as api_body
      FROM widgets w
      LEFT JOIN apis a ON w.api_id = a.id
      WHERE w.id = ?
    `).get(id);
    
    console.log('Updated widget data:', updatedWidget);
    
    if (!updatedWidget) {
      console.log('Failed to fetch updated widget');
      res.status(500).json({ error: 'Failed to fetch updated widget' });
      return;
    }
    
    // Convert boolean and JSON fields
    updatedWidget.active = Boolean(updatedWidget.active);
    updatedWidget.api_headers = updatedWidget.api_headers ? JSON.parse(updatedWidget.api_headers) : {};
    updatedWidget.api_body = updatedWidget.api_body ? JSON.parse(updatedWidget.api_body) : null;
    
    console.log('Sending success response');
    res.json({ 
      success: true, 
      widget: updatedWidget
    });
  } catch (error) {
    console.error('Error in toggle endpoint:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// Update widget position
app.put('/api/widgets/:id/position', (req, res) => {
  try {
    const { id } = req.params;
    const { position_x, position_y, width, height } = req.body;

    // Update widget position
    const result = dbInstance.prepare(`
      UPDATE widgets 
      SET position_x = ?,
          position_y = ?,
          width = ?,
          height = ?
      WHERE id = ?
    `).run(position_x, position_y, width, height, id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Widget not found' });
      return;
    }

    // Get updated widget
    const widget = dbInstance.prepare(`
      SELECT w.*, a.endpoint, a.name as api_name
      FROM widgets w
      LEFT JOIN apis a ON w.api_id = a.id
      WHERE w.id = ?
    `).get(id);

    res.json({ success: true, widget });
  } catch (error) {
    console.error('Error updating widget position:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update widget settings
app.put('/api/widgets/:id', (req, res) => {
  try {
    const { id } = req.params;
    let {
      title,
      type,
      widget_type,
      chart_type,
      api_id,
      data_path,
      refresh_interval
    } = req.body;

    // Convert types
    api_id = api_id ? parseInt(api_id, 10) : null;
    refresh_interval = refresh_interval ? parseInt(refresh_interval, 10) : 60000;
    chart_type = chart_type || null;

    // Get current widget to preserve position
    const currentWidget = dbInstance.prepare('SELECT position_x, position_y, width, height FROM widgets WHERE id = ?').get(id);
    if (!currentWidget) {
      res.status(404).json({ error: 'Widget not found' });
      return;
    }

    const result = dbInstance.prepare(`
      UPDATE widgets 
      SET title = ?, 
          type = ?,
          widget_type = ?,
          chart_type = ?,
          api_id = ?,
          data_path = ?,
          refresh_interval = ?,
          position_x = ?,
          position_y = ?,
          width = ?,
          height = ?
      WHERE id = ?
    `).run(
      title,
      type,
      widget_type,
      chart_type,
      api_id,
      data_path || '',
      refresh_interval,
      currentWidget.position_x,
      currentWidget.position_y,
      currentWidget.width,
      currentWidget.height,
      id
    );

    if (result.changes === 0) {
      res.status(404).json({ error: 'Widget not found' });
      return;
    }

    const widget = dbInstance.prepare(`
      SELECT 
        w.*,
        a.endpoint as api_endpoint,
        a.name as api_name,
        a.headers as api_headers,
        a.body as api_body
      FROM widgets w
      LEFT JOIN apis a ON w.api_id = a.id
      WHERE w.id = ?
    `).get(id);

    // Convert boolean and JSON fields
    widget.active = Boolean(widget.active);
    widget.api_headers = widget.api_headers ? JSON.parse(widget.api_headers) : {};
    widget.api_body = widget.api_body ? JSON.parse(widget.api_body) : null;

    res.json({ success: true, widget });
  } catch (error) {
    console.error('Error updating widget:', error);
    res.status(500).json({ error: 'Failed to update widget' });
  }
});

// Update widget
app.put('/api/widgets/:id/settings', (req, res) => {
  const { id } = req.params;
  const {
    title,
    type,
    widget_type,
    chart_type,
    api_endpoint,
    api_method,
    api_headers,
    api_body,
    data_path,
    refresh_interval
  } = req.body;

  try {
    dbInstance.prepare(`
      UPDATE widgets 
      SET title = ?, type = ?, widget_type = ?, chart_type = ?,
          api_endpoint = ?, api_method = ?, api_headers = ?, api_body = ?,
          data_path = ?, refresh_interval = ?
      WHERE id = ?
    `).run(
      title, type, widget_type, chart_type,
      api_endpoint, api_method,
      api_headers ? JSON.stringify(api_headers) : null,
      api_body ? JSON.stringify(api_body) : null,
      data_path, refresh_interval, id
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating widget:', error);
    res.status(500).json({ error: 'Failed to update widget' });
  }
});

// Add new widget
app.post('/api/widgets', (req, res) => {
  try {
    const {
      title,
      type,
      widget_type,
      chart_type,
      api_id,
      data_path,
      refresh_interval,
    } = req.body;

    const result = dbInstance.prepare(`
      INSERT INTO widgets (
        title, type, widget_type, chart_type,
        api_id, data_path, refresh_interval
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, type, widget_type, chart_type,
      api_id || null,
      data_path,
      Number(refresh_interval)
    );
    
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error adding widget:', error);
    res.status(500).json({ error: 'Failed to add widget' });
  }
});

// Delete widget
app.delete('/api/widgets/:id', (req, res) => {
  try {
    const { id } = req.params;
    dbInstance.prepare('DELETE FROM widgets WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting widget:', error);
    res.status(500).json({ error: 'Failed to delete widget' });
  }
});

// Get all APIs
app.get('/api/apis', (req, res) => {
  const apis = dbInstance.prepare('SELECT * FROM apis').all();
  res.json(apis);
});

// Add new API
app.post('/api/apis', (req, res) => {
  const { name, description, endpoint, method, headers, body } = req.body;
  
  try {
    const result = dbInstance.prepare(`
      INSERT INTO apis (name, description, endpoint, method, headers, body)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name, description, endpoint, method,
      headers ? JSON.stringify(headers) : null,
      body ? JSON.stringify(body) : null
    );
    
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error adding API:', error);
    res.status(500).json({ error: 'Failed to add API' });
  }
});

// Update API
app.put('/api/apis/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, endpoint, method, headers, body } = req.body;
  
  try {
    dbInstance.prepare(`
      UPDATE apis 
      SET name = ?, description = ?, endpoint = ?, method = ?, headers = ?, body = ?
      WHERE id = ?
    `).run(
      name, description, endpoint, method,
      headers ? JSON.stringify(headers) : null,
      body ? JSON.stringify(body) : null,
      id
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating API:', error);
    res.status(500).json({ error: 'Failed to update API' });
  }
});

// Delete API
app.delete('/api/apis/:id', (req, res) => {
  const { id } = req.params;
  try {
    // First check if API is being used by any widgets
    const widgets = dbInstance.prepare('SELECT id FROM widgets WHERE api_id = ?').all(id);
    if (widgets.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete API that is being used by widgets',
        widgets: widgets 
      });
    }
    
    dbInstance.prepare('DELETE FROM apis WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting API:', error);
    res.status(500).json({ error: 'Failed to delete API' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
