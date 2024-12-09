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
    // Update widget positions in the database
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Dashboard</Typography>
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={100}
        width={1200}
        onLayoutChange={onLayoutChange}
        draggableHandle=".widget-header"
      >
        {widgets.map(widget => (
          <Paper
            key={widget.id}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box
              className="widget-header"
              sx={{
                p: 1,
                backgroundColor: 'primary.main',
                color: 'white',
                cursor: 'move',
              }}
            >
              <Typography variant="subtitle1">{widget.title}</Typography>
            </Box>
            <Box sx={{ p: 2, flexGrow: 1 }}>
              {/* Widget content will go here */}
              <Typography>Widget Content</Typography>
            </Box>
          </Paper>
        ))}
      </GridLayout>
    </Box>
  );
};

export default Dashboard;
