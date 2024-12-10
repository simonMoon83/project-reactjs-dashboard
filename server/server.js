import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import Database from 'better-sqlite3';
import db from './database.js';

const app = express();

app.use(cors());
app.use(express.json());

// Real database API endpoints
app.get('/api/sales', (req, res) => {
  try {
    const data = db.prepare('SELECT month as name, value FROM sales').all();
    res.json({ data });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sales', (req, res) => {
  try {
    const { month, value } = req.body;
    const result = db
      .prepare('INSERT INTO sales (month, value) VALUES (?, ?)')
      .run(month, value);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating sales data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products', (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM products').all();
    res.json({ data });
  } catch (error) {
    console.error('Error fetching products data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { name, value } = req.body;
    const result = db
      .prepare('INSERT INTO products (name, value) VALUES (?, ?)')
      .run(name, value);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating product data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/pie', (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM pie_data').all();
    res.json({ data });
  } catch (error) {
    console.error('Error fetching pie data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/pie', (req, res) => {
  try {
    const { name, value } = req.body;
    const result = db
      .prepare('INSERT INTO pie_data (name, value) VALUES (?, ?)')
      .run(name, value);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating pie data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get menu items
app.get('/api/menu', (req, res) => {
  const menuItems = db.prepare('SELECT * FROM menu_items').all();
  res.json(menuItems);
});

// Get all widgets (including inactive ones) for settings page
app.get('/api/widgets/all', (req, res) => {
  try {
    const widgets = db.prepare(`
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
    const widgets = db.prepare(`
      SELECT 
        widgets.*,
        apis.endpoint,
        apis.method,
        apis.headers,
        apis.body,
        apis.name as api_name
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
    console.log('Fetching data for widget:', id);

    const widget = db.prepare(`
      SELECT w.*, a.type as api_type, a.endpoint, a.method, a.query, a.headers, a.body
      FROM widgets w
      LEFT JOIN apis a ON w.api_id = a.id
      WHERE w.id = ?
    `).get(id);

    console.log('Widget found:', widget);

    if (!widget) {
      console.log('Widget not found');
      return res.status(404).json({ error: 'Widget not found' });
    }

    if (!widget.api_id) {
      console.log('Widget has no associated API');
      return res.status(400).json({ error: 'Widget has no associated API' });
    }

    let data;
    if (widget.api_type === 'internal') {
      // Execute SQL query for internal API
      if (!widget.query) {
        console.log('SQL query not defined for internal API');
        return res.status(400).json({ error: 'SQL query not defined for internal API' });
      }
      console.log('Executing internal query:', widget.query);
      const queryResult = db.prepare(widget.query).all();
      console.log('Query result:', queryResult);
      data = { data: queryResult };  
    } else {
      // Make HTTP request for external API
      const headers = widget.headers ? JSON.parse(widget.headers) : {};
      const body = widget.body ? JSON.parse(widget.body) : undefined;
      
      console.log('Making external API request:', {
        url: widget.endpoint,
        method: widget.method,
        headers,
        body: widget.method !== 'GET' ? body : undefined
      });

      const response = await fetch(widget.endpoint, {
        method: widget.method,
        headers,
        body: widget.method !== 'GET' ? JSON.stringify(body) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`External API returned ${response.status}`);
      }
      
      data = await response.json();
      console.log('External API response:', data);
    }

    // Extract data using data_path if specified
    if (widget.data_path) {
      console.log('Extracting data using path:', widget.data_path);
      const paths = widget.data_path.split('.');
      let result = data;
      for (const path of paths) {
        result = result?.[path];
        if (result === undefined) {
          console.log('Data path not found in response');
          return res.status(500).json({ error: `Data path '${widget.data_path}' not found in response` });
        }
      }
      data = result;
      console.log('Extracted data:', data);
    }

    console.log('Sending response:', { data });
    res.json({ data });
  } catch (error) {
    console.error('Error fetching widget data:', error);
    res.status(500).json({ error: 'Failed to fetch widget data' });
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
    const widget = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id);
    console.log('Current widget state:', widget);
    
    if (!widget) {
      console.log('Widget not found in database');
      res.status(404).json({ error: 'Widget not found' });
      return;
    }
    
    // Update widget active status
    console.log('Executing update query...');
    const result = db.prepare('UPDATE widgets SET active = ? WHERE id = ?').run(newActiveValue, id);
    console.log('Update result:', result);
    
    if (result.changes === 0) {
      console.log('No rows were updated');
      res.status(500).json({ error: 'Failed to update widget' });
      return;
    }
    
    // Get updated widget with API info
    console.log('Fetching updated widget data...');
    const updatedWidget = db.prepare(`
      SELECT 
        w.*,
        a.endpoint,
        a.method,
        a.headers,
        a.body,
        a.name as api_name
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
    const result = db.prepare(`
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
    const widget = db.prepare(`
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

// Update widget
app.put('/api/widgets/:id', async (req, res) => {
  const { 
    id 
  } = req.params;

  const { 
    title,
    type,
    widget_type,
    chart_type,
    api_id,
    data_path,
    refresh_interval,
    position_x,
    position_y,
    width,
    height
  } = req.body;

  try {
    // Get current widget to preserve existing values
    const currentWidget = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id);
    if (!currentWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    db.prepare(`
      UPDATE widgets 
      SET title = ?, type = ?, widget_type = ?, chart_type = ?,
          api_id = ?, data_path = ?, refresh_interval = ?,
          position_x = ?, position_y = ?, width = ?, height = ?
      WHERE id = ?
    `).run(
      title || currentWidget.title,
      type || currentWidget.type,
      widget_type || currentWidget.widget_type,
      chart_type || currentWidget.chart_type,
      api_id || currentWidget.api_id,
      data_path || currentWidget.data_path,
      refresh_interval || currentWidget.refresh_interval,
      position_x || currentWidget.position_x,
      position_y || currentWidget.position_y,
      width || currentWidget.width,
      height || currentWidget.height,
      id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating widget:', error);
    res.status(500).json({ error: 'Failed to update widget' });
  }
});

// Update widget settings
app.put('/api/widgets/:id/settings', (req, res) => {
  const { id } = req.params;
  const {
    title,
    type,
    widget_type,
    chart_type,
    api_id,
    data_path,
    refresh_interval
  } = req.body;

  try {
    // Get current widget
    const currentWidget = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id);
    if (!currentWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    // Update widget
    db.prepare(`
      UPDATE widgets 
      SET title = ?, type = ?, widget_type = ?, chart_type = ?,
          api_id = ?, data_path = ?, refresh_interval = ?
      WHERE id = ?
    `).run(
      title || currentWidget.title,
      type || currentWidget.type,
      widget_type || currentWidget.widget_type,
      chart_type || currentWidget.chart_type,
      api_id || currentWidget.api_id,
      data_path || currentWidget.data_path,
      refresh_interval || currentWidget.refresh_interval,
      id
    );

    // Get updated widget with API info
    const updatedWidget = db.prepare(`
      SELECT 
        w.*,
        a.endpoint,
        a.method,
        a.headers,
        a.body,
        a.name as api_name
      FROM widgets w
      LEFT JOIN apis a ON w.api_id = a.id
      WHERE w.id = ?
    `).get(id);

    res.json({ success: true, widget: updatedWidget });
  } catch (error) {
    console.error('Error updating widget settings:', error);
    res.status(500).json({ error: 'Failed to update widget settings' });
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

    const result = db.prepare(`
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
    db.prepare('DELETE FROM widgets WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting widget:', error);
    res.status(500).json({ error: 'Failed to delete widget' });
  }
});

// Sample data endpoints for testing
app.get('/api/sample/products', (req, res) => {
  const sampleData = {
    data: [
      { name: '2024-01', value: 1200 },
      { name: '2024-02', value: 1500 },
      { name: '2024-03', value: 1800 },
      { name: '2024-04', value: 1600 },
      { name: '2024-05', value: 2000 },
      { name: '2024-06', value: 2200 }
    ]
  };
  res.json(sampleData);
});

// API management endpoints
app.get('/api/apis', (req, res) => {
  try {
    const apis = db.prepare('SELECT * FROM apis').all();
    res.json(apis);
  } catch (error) {
    console.error('Error fetching APIs:', error);
    res.status(500).json({ error: 'Failed to fetch APIs' });
  }
});

app.post('/api/apis', (req, res) => {
  try {
    const { name, description, type, endpoint, method, query, headers, body } = req.body;
    const result = db
      .prepare('INSERT INTO apis (name, description, type, endpoint, method, query, headers, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(name, description, type, endpoint, method, query, headers, body);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating API:', error);
    res.status(500).json({ error: 'Failed to create API' });
  }
});

app.put('/api/apis/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, endpoint, method, query, headers, body } = req.body;
    db
      .prepare('UPDATE apis SET name = ?, description = ?, type = ?, endpoint = ?, method = ?, query = ?, headers = ?, body = ? WHERE id = ?')
      .run(name, description, type, endpoint, method, query, headers, body, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating API:', error);
    res.status(500).json({ error: 'Failed to update API' });
  }
});

app.delete('/api/apis/:id', (req, res) => {
  try {
    const { id } = req.params;
    // Check if API is being used by any widgets
    const widgets = db.prepare('SELECT id FROM widgets WHERE api_id = ?').all(id);
    if (widgets.length > 0) {
      return res.status(400).json({ error: 'Cannot delete API that is being used by widgets' });
    }
    db.prepare('DELETE FROM apis WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting API:', error);
    res.status(500).json({ error: 'Failed to delete API' });
  }
});

// Dynamic API endpoint handler
app.get('/api/endpoints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const api = db.prepare('SELECT * FROM apis WHERE id = ?').get(id);
    if (!api) {
      return res.status(404).json({ error: 'API not found' });
    }

    let data;
    if (api.type === 'internal') {
      // Internal DB query
      if (!api.query) {
        return res.status(400).json({ error: 'SQL query not defined for internal API' });
      }
      data = db.prepare(api.query).all();
    } else {
      // External API call
      const headers = api.headers ? JSON.parse(api.headers) : {};
      const body = api.body ? JSON.parse(api.body) : undefined;
      
      const response = await fetch(api.endpoint, {
        method: api.method,
        headers,
        body: api.method !== 'GET' ? JSON.stringify(body) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`External API returned ${response.status}`);
      }
      
      data = await response.json();
    }

    res.json({ data });
  } catch (error) {
    console.error('Error calling API endpoint:', error);
    res.status(500).json({ error: 'Failed to call API endpoint' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
