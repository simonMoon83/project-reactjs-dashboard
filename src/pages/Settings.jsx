import { useState } from 'react';
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
} from '@mui/material';

const widgetTypes = [
  { value: 'sales', label: 'Sales Widget' },
  { value: 'customers', label: 'Customer Widget' },
  { value: 'products', label: 'Product Widget' },
  { value: 'chart', label: 'Chart Widget' },
];

const Settings = () => {
  const [open, setOpen] = useState(false);
  const [newWidget, setNewWidget] = useState({
    title: '',
    type: '',
    config: {},
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAddWidget = () => {
    fetch('http://localhost:3001/api/widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWidget),
    })
      .then(res => res.json())
      .then(() => {
        handleClose();
        setNewWidget({ title: '', type: '', config: {} });
      });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Settings</Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Widget Management</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpen}
        >
          Add New Widget
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Widget</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Widget Title"
            fullWidth
            value={newWidget.title}
            onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Widget Type"
            fullWidth
            value={newWidget.type}
            onChange={(e) => setNewWidget({ ...newWidget, type: e.target.value })}
          >
            {widgetTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddWidget} variant="contained">Add Widget</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
