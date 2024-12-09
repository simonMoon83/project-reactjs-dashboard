import { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import GridLayout from 'react-grid-layout';
import WidgetContent from '../components/WidgetContent';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const Dashboard = () => {
  const [widgets, setWidgets] = useState([]);
  const [layout, setLayout] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/widgets')
      .then(res => res.json())
      .then(data => {
        setWidgets(data);
        setLayout(data.map(widget => ({
          i: widget.id.toString(),
          x: widget.position_x || 0,
          y: widget.position_y || 0,
          w: widget.width || 4,
          h: widget.height || 4,
        })));
      });
  }, []);

  const onLayoutChange = (newLayout) => {
    setLayout(newLayout);
    newLayout.forEach(item => {
      const widgetId = parseInt(item.i);
      fetch(`http://localhost:3001/api/widgets/${widgetId}/position`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position_x: item.x,
          position_y: item.y,
          width: item.w,
          height: item.h,
        }),
      });
    });
  };

  const handleRemoveWidget = (widgetId) => {
    if (window.confirm('Are you sure you want to remove this widget from the dashboard?')) {
      fetch(`http://localhost:3001/api/widgets/${widgetId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: false }),
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to toggle widget');
          }
          return res.json();
        })
        .then(() => {
          setWidgets(prevWidgets => prevWidgets.filter(w => w.id !== widgetId));
          setLayout(prevLayout => prevLayout.filter(item => item.i !== widgetId.toString()));
        })
        .catch(error => {
          console.error('Error removing widget:', error);
          alert('Failed to remove widget');
        });
    }
  };

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: '100vh',
      pt: 2,
      backgroundColor: '#f8fafc'
    }}>
      <Box sx={{ px: 3, mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
      </Box>
      <Box sx={{ px: 3 }}>
        <GridLayout
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={100}
          width={window.innerWidth - 280}
          onLayoutChange={onLayoutChange}
          draggableHandle=".widget-header"
          margin={[16, 16]}
        >
          {widgets.map(widget => (
            <Paper
              key={widget.id}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
              }}
            >
              <Box
                className="widget-header"
                sx={{
                  p: 1.5,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  cursor: 'move',
                }}
              >
                <Typography variant="subtitle1">{widget.title}</Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveWidget(widget.id)}
                  title="Remove from dashboard"
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <WidgetContent widget={widget} />
              </Box>
            </Paper>
          ))}
        </GridLayout>
      </Box>
    </Box>
  );
};

export default Dashboard;
