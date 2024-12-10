import { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Grid, useTheme as useMuiTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import GridLayout from 'react-grid-layout';
import WidgetContent from '../components/WidgetContent';
import { useTheme } from '../context/ThemeContext';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const Dashboard = () => {
  const [widgets, setWidgets] = useState([]);
  const [layout, setLayout] = useState([]);
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();

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

  const handleRemoveWidget = async (widgetId) => {
    try {
      console.log('Attempting to remove widget:', widgetId);
      
      const confirmed = window.confirm('Are you sure you want to remove this widget from the dashboard?');
      if (!confirmed) {
        console.log('Widget removal cancelled by user');
        return;
      }

      console.log('Sending request to toggle widget:', widgetId);
      
      // Log the request details
      const requestBody = { active: false };
      console.log('Request body:', requestBody);
      
      const response = await fetch(`http://localhost:3001/api/widgets/${widgetId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers]));
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Server response was not valid JSON');
      }

      if (!response.ok) {
        throw new Error(data.error || `Server returned ${response.status}`);
      }

      if (data.success) {
        console.log('Successfully removed widget, updating state...');
        setWidgets(prevWidgets => {
          console.log('Previous widgets:', prevWidgets);
          const newWidgets = prevWidgets.filter(w => w.id !== widgetId);
          console.log('New widgets:', newWidgets);
          return newWidgets;
        });
        
        setLayout(prevLayout => {
          console.log('Previous layout:', prevLayout);
          const newLayout = prevLayout.filter(item => item.i !== widgetId.toString());
          console.log('New layout:', newLayout);
          return newLayout;
        });
        
        console.log('State updates completed');
      } else {
        throw new Error('Server indicated failure');
      }
    } catch (error) {
      console.error('Error in handleRemoveWidget:', error);
      console.error('Error stack:', error.stack);
      alert(`Failed to remove widget: ${error.message}`);
    }
  };

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: '100vh',
      pt: 2,
      backgroundColor: isDarkMode ? muiTheme.palette.background.default : '#f8fafc'
    }}>
      <Box sx={{ px: 3, mb: 3 }}>
        <Typography variant="h4" sx={{ color: isDarkMode ? 'text.primary' : 'inherit' }}>Dashboard</Typography>
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
          resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
          transformScale={1}
          isResizable={true}
          compactType={null}
          preventCollision={true}
          style={{ minHeight: '800px' }}
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
                backgroundColor: isDarkMode ? muiTheme.palette.background.paper : '#fff',
                boxShadow: isDarkMode 
                  ? '0 1px 3px rgba(255,255,255,0.12)' 
                  : '0 1px 3px rgba(0,0,0,0.12)',
                '& .react-resizable-handle': {
                  position: 'absolute',
                  width: '20px',
                  height: '20px',
                  bottom: '0',
                  right: '0',
                  cursor: 'se-resize',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: '3px',
                    bottom: '3px',
                    width: '5px',
                    height: '5px',
                    borderRight: `2px solid ${isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}`,
                    borderBottom: `2px solid ${isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}`,
                  },
                  '&:hover::after': {
                    borderColor: muiTheme.palette.primary.main,
                  },
                },
                '& .react-resizable-handle-n': {
                  top: '0',
                  left: '50%',
                  marginLeft: '-10px',
                  cursor: 'n-resize',
                },
                '& .react-resizable-handle-e': {
                  right: '0',
                  top: '50%',
                  marginTop: '-10px',
                  cursor: 'e-resize',
                },
                '& .react-resizable-handle-s': {
                  bottom: '0',
                  left: '50%',
                  marginLeft: '-10px',
                  cursor: 's-resize',
                },
                '& .react-resizable-handle-w': {
                  left: '0',
                  top: '50%',
                  marginTop: '-10px',
                  cursor: 'w-resize',
                },
                '& .react-resizable-handle-ne': {
                  top: '0',
                  right: '0',
                  cursor: 'ne-resize',
                },
                '& .react-resizable-handle-nw': {
                  top: '0',
                  left: '0',
                  cursor: 'nw-resize',
                },
                '& .react-resizable-handle-se': {
                  bottom: '0',
                  right: '0',
                  cursor: 'se-resize',
                },
                '& .react-resizable-handle-sw': {
                  bottom: '0',
                  left: '0',
                  cursor: 'sw-resize',
                }
              }}
            >
              <Box
                className="widget-header"
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                  cursor: 'move'
                }}
              >
                <Typography variant="h6" sx={{ color: isDarkMode ? 'text.primary' : 'inherit' }}>
                  {widget.title}
                </Typography>
                <IconButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Delete button clicked for widget:', widget.id);
                    handleRemoveWidget(widget.id);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  size="small"
                  sx={{ 
                    color: isDarkMode ? 'text.secondary' : 'inherit',
                    '&:hover': {
                      color: 'error.main',
                      backgroundColor: 'rgba(211, 47, 47, 0.04)'
                    },
                    position: 'relative',
                    zIndex: 1000
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
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
