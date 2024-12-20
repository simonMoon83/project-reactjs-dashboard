import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Paper,
  Switch,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '../context/ThemeContext';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const WIDGET_TYPES = [
  { value: 'chart', label: 'Chart' },
  { value: 'table', label: 'Table' },
  { value: 'text', label: 'Text' },
];

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'doughnut', label: 'Doughnut Chart' },
  { value: 'radar', label: 'Radar Chart' },
  { value: 'polarArea', label: 'Polar Area Chart' },
];

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

const API_TYPES = ['internal', 'external'];

const Settings = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [openApi, setOpenApi] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [editingApi, setEditingApi] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [apis, setApis] = useState([]);
  const [newWidget, setNewWidget] = useState({
    title: '',
    type: 'chart',
    widget_type: 'chart',
    chart_type: 'line',
    api_id: '',
    data_path: '',
    refresh_interval: 60,
  });
  const [newApi, setNewApi] = useState({
    name: '',
    description: '',
    type: 'external',
    endpoint: '',
    method: 'GET',
    query: '',
    headers: '',
    body: '',
  });

  // Fetch widgets and APIs on component mount
  useEffect(() => {
    fetchWidgets();
    fetchApis();
  }, []);

  const fetchWidgets = () => {
    fetch('http://localhost:3001/api/widgets/all')
      .then(res => res.json())
      .then(data => {
        // Ensure active property is boolean
        const processedWidgets = data.map(widget => ({
          ...widget,
          active: Boolean(widget.active)
        }));
        setWidgets(processedWidgets);
      })
      .catch(error => console.error('Error fetching widgets:', error));
  };

  const fetchApis = () => {
    fetch('http://localhost:3001/api/apis')
      .then(res => res.json())
      .then(data => setApis(data))
      .catch(error => console.error('Error fetching APIs:', error));
  };

  // API Dialog handlers
  const handleOpenApi = (api = null) => {
    if (api) {
      setEditingApi(api);
      setNewApi({
        ...api,
        headers: api.headers ? JSON.stringify(JSON.parse(api.headers), null, 2) : '',
        body: api.body ? JSON.stringify(JSON.parse(api.body), null, 2) : '',
      });
    } else {
      setEditingApi(null);
      setNewApi({
        name: '',
        description: '',
        type: 'external',
        endpoint: '',
        method: 'GET',
        query: '',
        headers: '',
        body: '',
      });
    }
    setOpenApi(true);
  };

  const handleCloseApi = () => {
    setOpenApi(false);
    setEditingApi(null);
    setNewApi({
      name: '',
      description: '',
      type: 'external',
      endpoint: '',
      method: 'GET',
      query: '',
      headers: '',
      body: '',
    });
  };

  const handleSaveApi = async () => {
    const apiData = editingApi ? { ...newApi } : newApi;
    
    try {
      // Validate JSON fields for external APIs
      if (apiData.type === 'external') {
        if (apiData.headers) {
          JSON.parse(apiData.headers);
        }
        if (apiData.body) {
          JSON.parse(apiData.body);
        }
      }

      const response = await fetch(`http://localhost:3001/api/apis${editingApi ? `/${editingApi.id}` : ''}`, {
        method: editingApi ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error('Failed to save API');
      }

      fetchApis();
      setOpenApi(false);
      setEditingApi(null);
      setNewApi({
        name: '',
        description: '',
        type: 'external',
        endpoint: '',
        method: 'GET',
        query: '',
        headers: '',
        body: '',
      });
    } catch (error) {
      console.error('Error saving API:', error);
      alert(error.message || 'Failed to save API');
    }
  };

  const handleDeleteApi = async (api) => {
    try {
      const response = await fetch(`http://localhost:3001/api/apis/${api.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete API');
      }

      fetchApis();
    } catch (error) {
      console.error('Error deleting API:', error);
      alert('Failed to delete API');
    }
  };

  const handleEditApi = (api) => {
    setEditingApi(api);
    setNewApi({
      name: api.name,
      description: api.description || '',
      type: api.type,
      endpoint: api.endpoint,
      method: api.method,
      query: api.query || '',
      headers: api.headers || '',
      body: api.body || '',
    });
    setOpenApi(true);
  };

  const handleOpen = (widget = null) => {
    if (widget) {
      setEditingWidget(widget);
      setNewWidget({
        ...widget,
        api_id: widget.api_id.toString(),
      });
    } else {
      setEditingWidget(null);
      setNewWidget({
        title: '',
        type: 'chart',
        widget_type: 'chart',
        chart_type: 'line',
        api_id: '',
        data_path: '',
        refresh_interval: 60,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingWidget(null);
    setNewWidget({
      title: '',
      type: 'chart',
      widget_type: 'chart',
      chart_type: 'line',
      api_id: '',
      data_path: '',
      refresh_interval: 60,
    });
  };

  const handleSaveWidget = () => {
    // Validate and parse JSON fields
    let headers, body;
    try {
      headers = newWidget.api_headers ? JSON.parse(newWidget.api_headers) : {};
      body = newWidget.api_body ? JSON.parse(newWidget.api_body) : null;
    } catch (error) {
      alert('Invalid JSON in headers or body');
      return;
    }

    const url = editingWidget
      ? `http://localhost:3001/api/widgets/${editingWidget.id}/settings`
      : 'http://localhost:3001/api/widgets';

    fetch(url, {
      method: editingWidget ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newWidget,
        api_headers: headers,
        api_body: body,
        refresh_interval: Number(newWidget.refresh_interval),
      }),
    })
      .then(res => res.json())
      .then(() => {
        handleClose();
        fetchWidgets();
      })
      .catch(error => {
        console.error('Error saving widget:', error);
        alert('Failed to save widget');
      });
  };

  const handleDeleteWidget = (widgetId) => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      fetch(`http://localhost:3001/api/widgets/${widgetId}`, {
        method: 'DELETE',
      })
        .then(res => res.json())
        .then(() => {
          fetchWidgets();
        })
        .catch(error => {
          console.error('Error deleting widget:', error);
          alert('Failed to delete widget');
        });
    }
  };

  const handleToggleWidget = (widget) => {
    const newActive = !widget.active;
    fetch(`http://localhost:3001/api/widgets/${widget.id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active: newActive }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(() => {
        setWidgets(widgets.map(w => 
          w.id === widget.id ? { ...w, active: newActive } : w
        ));
      })
      .catch(error => {
        console.error('Error toggling widget:', error);
        alert('Failed to toggle widget');
      });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      
      {/* Theme Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Theme Settings</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LightModeIcon />
          <Switch
            checked={isDarkMode}
            onChange={toggleTheme}
            inputProps={{ 'aria-label': 'theme toggle' }}
          />
          <DarkModeIcon />
          <Typography>
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </Typography>
        </Box>
      </Paper>

      {/* API Management Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>API Management</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenApi()}
          sx={{ mb: 3 }}
        >
          Add New API
        </Button>

        <Grid container spacing={2}>
          {apis.map(api => (
            <Grid item xs={12} key={api.id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{api.name}</Typography>
                    <Typography color="text.secondary">
                      {api.description}
                    </Typography>
                    <Typography color="text.secondary">
                      {api.type === 'internal' ? 'Internal (DB Query)' : `${api.method} ${api.endpoint}`}
                    </Typography>
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleOpenApi(api)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteApi(api)}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Widget Management Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Widget Management</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen()}
          sx={{ mb: 3 }}
        >
          Add New Widget
        </Button>

        <Grid container spacing={2}>
          {widgets.map(widget => (
            <Grid item xs={12} key={widget.id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{widget.title}</Typography>
                    <Typography color="text.secondary">
                      Type: {widget.widget_type} {widget.chart_type ? `(${widget.chart_type})` : ''}
                    </Typography>
                    <Typography color="text.secondary">
                      API: {apis.find(api => api.id === widget.api_id)?.name || 'None'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      checked={Boolean(widget.active)}
                      onChange={() => handleToggleWidget(widget)}
                    />
                    <IconButton
                      color="primary"
                      onClick={() => handleOpen(widget)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteWidget(widget.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* API Dialog */}
      <Dialog open={openApi} onClose={() => setOpenApi(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingApi ? 'Edit API' : 'Add API'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={newApi.name}
                onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newApi.description}
                onChange={(e) => setNewApi({ ...newApi, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>API Type</InputLabel>
                <Select
                  value={newApi.type}
                  label="API Type"
                  onChange={(e) => setNewApi({ ...newApi, type: e.target.value })}
                >
                  {API_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type === 'internal' ? 'Internal (DB Query)' : 'External (HTTP Request)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={newApi.type === 'internal' ? 'Table/View Name' : 'Endpoint URL'}
                value={newApi.endpoint}
                onChange={(e) => setNewApi({ ...newApi, endpoint: e.target.value })}
                helperText={
                  newApi.type === 'internal'
                    ? 'Enter the table or view name to query'
                    : 'Enter the full URL for the external API'
                }
              />
            </Grid>
            {newApi.type === 'internal' ? (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="SQL Query"
                  multiline
                  rows={4}
                  value={newApi.query}
                  onChange={(e) => setNewApi({ ...newApi, query: e.target.value })}
                  helperText="Enter the SQL query to execute. Use column aliases if needed."
                />
              </Grid>
            ) : (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Method</InputLabel>
                    <Select
                      value={newApi.method}
                      label="Method"
                      onChange={(e) => setNewApi({ ...newApi, method: e.target.value })}
                    >
                      {HTTP_METHODS.map((method) => (
                        <MenuItem key={method} value={method}>
                          {method}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Headers (JSON)"
                    multiline
                    rows={4}
                    value={newApi.headers}
                    onChange={(e) => setNewApi({ ...newApi, headers: e.target.value })}
                    helperText="Example: {'Authorization': 'Bearer token'}"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Body (JSON)"
                    multiline
                    rows={4}
                    value={newApi.body}
                    onChange={(e) => setNewApi({ ...newApi, body: e.target.value })}
                    helperText="Request body for POST/PUT methods"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApi(false)}>Cancel</Button>
          <Button onClick={handleSaveApi} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Widget Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingWidget ? 'Edit Widget' : 'Add New Widget'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Widget Title"
                fullWidth
                value={newWidget.title}
                onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Widget Type</InputLabel>
                <Select
                  value={newWidget.type}
                  label="Widget Type"
                  onChange={(e) => setNewWidget({ 
                    ...newWidget, 
                    type: e.target.value,
                    widget_type: e.target.value,
                    chart_type: e.target.value === 'chart' ? 'line' : null
                  })}
                >
                  {WIDGET_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {newWidget.type === 'chart' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Chart Type</InputLabel>
                  <Select
                    value={newWidget.chart_type}
                    label="Chart Type"
                    onChange={(e) => setNewWidget({ ...newWidget, chart_type: e.target.value })}
                  >
                    {CHART_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>API</InputLabel>
                <Select
                  value={newWidget.api_id}
                  label="API"
                  onChange={(e) => setNewWidget({ ...newWidget, api_id: e.target.value })}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {apis.map((api) => (
                    <MenuItem key={api.id} value={api.id}>
                      {api.name} ({api.type === 'internal' ? 'Internal (DB Query)' : `${api.method} ${api.endpoint}`})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Data Path"
                fullWidth
                value={newWidget.data_path}
                onChange={(e) => setNewWidget({ ...newWidget, data_path: e.target.value })}
                helperText="Path to data in API response (e.g., 'data.items')"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Refresh Interval (seconds)"
                fullWidth
                type="number"
                value={newWidget.refresh_interval}
                onChange={(e) => setNewWidget({ ...newWidget, refresh_interval: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSaveWidget} variant="contained" color="primary">
            {editingWidget ? 'Save Changes' : 'Add Widget'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
