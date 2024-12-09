import { useState, useEffect } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import GridLayout from 'react-grid-layout';
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
          x: widget.position_x,
          y: widget.position_y,
          w: widget.width,
          h: widget.height,
        })));
      });
  }, []);

  const onLayoutChange = (newLayout) => {
    setLayout(newLayout);
    newLayout.forEach(item => {
      const widgetId = parseInt(item.i);
      fetch(`http://localhost:3001/api/widgets/${widgetId}`, {
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
          width={window.innerWidth - 280} // Adjust width to account for sidebar
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
              </Box>
              <Box sx={{ p: 2, flexGrow: 1 }}>
                <Typography>Widget Content</Typography>
              </Box>
            </Paper>
          ))}
        </GridLayout>
      </Box>
    </Box>
  );
};

export default Dashboard;
