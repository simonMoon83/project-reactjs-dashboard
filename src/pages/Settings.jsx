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
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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

const Settings = () => {
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
    endpoint: '',
    method: 'GET',
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
        endpoint: '',
        method: 'GET',
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
      endpoint: '',
      method: 'GET',
      headers: '',
      body: '',
    });
  };

  const handleSaveApi = () => {
    // Validate and parse JSON fields
    let headers, body;
    try {
      headers = newApi.headers ? JSON.parse(newApi.headers) : {};
      body = newApi.body ? JSON.parse(newApi.body) : null;
    } catch (error) {
      alert('Invalid JSON in headers or body');
      return;
    }

    const url = editingApi
      ? `http://localhost:3001/api/apis/${editingApi.id}`
      : 'http://localhost:3001/api/apis';

    fetch(url, {
      method: editingApi ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newApi,
        headers,
        body,
      }),
    })
      .then(res => res.json())
      .then(() => {
        handleCloseApi();
        fetchApis();
      })
      .catch(error => {
        console.error('Error saving API:', error);
        alert('Failed to save API');
      });
  };

  const handleDeleteApi = (apiId) => {
    if (window.confirm('Are you sure you want to delete this API?')) {
      fetch(`http://localhost:3001/api/apis/${apiId}`, {
        method: 'DELETE',
      })
        .then(res => res.json())
        .then((data) => {
          if (data.error) {
            alert(data.error);
          } else {
            fetchApis();
          }
        })
        .catch(error => {
          console.error('Error deleting API:', error);
          alert('Failed to delete API');
        });
    }
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
      <Typography variant="h4" sx={{ mb: 4 }}>Settings</Typography>
      
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
                      {api.method} {api.endpoint}
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
                      onClick={() => handleDeleteApi(api.id)}
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
      <Dialog open={openApi} onClose={handleCloseApi} maxWidth="md" fullWidth>
        <DialogTitle>{editingApi ? 'Edit API' : 'Add New API'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="API Name"
                fullWidth
                value={newApi.name}
                onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                value={newApi.description}
                onChange={(e) => setNewApi({ ...newApi, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                label="Endpoint"
                fullWidth
                value={newApi.endpoint}
                onChange={(e) => setNewApi({ ...newApi, endpoint: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>HTTP Method</InputLabel>
                <Select
                  value={newApi.method}
                  label="HTTP Method"
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
                label="Headers (JSON)"
                fullWidth
                multiline
                rows={4}
                value={newApi.headers}
                onChange={(e) => setNewApi({ ...newApi, headers: e.target.value })}
                helperText="Example: {'Authorization': 'Bearer token'}"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Body (JSON)"
                fullWidth
                multiline
                rows={4}
                value={newApi.body}
                onChange={(e) => setNewApi({ ...newApi, body: e.target.value })}
                helperText="Example: {'key': 'value'}"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApi}>Cancel</Button>
          <Button onClick={handleSaveApi} variant="contained" color="primary">
            {editingApi ? 'Save Changes' : 'Add API'}
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
                      {api.name} ({api.method} {api.endpoint})
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
