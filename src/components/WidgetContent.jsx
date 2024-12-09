import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, useTheme as useMuiTheme } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../context/ThemeContext';

const WidgetContent = ({ widget }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();

  const chartColors = {
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    text: isDarkMode ? '#fff' : '#666',
    bars: isDarkMode ? '#90caf9' : '#8884d8',
    lines: isDarkMode ? '#90caf9' : '#8884d8',
    pie: isDarkMode ? ['#90caf9', '#f48fb1', '#81c784', '#ffb74d'] : ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'],
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/widgets/${widget.id}/data`);
      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching widget data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (widget.refresh_interval > 0) {
      const interval = setInterval(fetchData, widget.refresh_interval * 1000);
      return () => clearInterval(interval);
    }
  }, [widget.id, widget.refresh_interval]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, color: 'error.main' }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No data available</Typography>
      </Box>
    );
  }

  const renderChart = () => {
    const chartProps = {
      width: '100%',
      height: 300,
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const commonCartesianProps = {
      stroke: chartColors.text,
      style: { fontSize: '12px' },
    };

    switch (widget.chart_type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis {...commonCartesianProps} dataKey="name" />
              <YAxis {...commonCartesianProps} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#424242' : '#fff',
                  border: `1px solid ${chartColors.grid}`,
                  color: chartColors.text 
                }} 
              />
              <Legend wrapperStyle={{ color: chartColors.text }} />
              <Bar dataKey="value" fill={chartColors.bars} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis {...commonCartesianProps} dataKey="name" />
              <YAxis {...commonCartesianProps} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#424242' : '#fff',
                  border: `1px solid ${chartColors.grid}`,
                  color: chartColors.text 
                }} 
              />
              <Legend wrapperStyle={{ color: chartColors.text }} />
              <Line type="monotone" dataKey="value" stroke={chartColors.lines} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill={chartColors.pie[0]}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors.pie[index % chartColors.pie.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#424242' : '#fff',
                  border: `1px solid ${chartColors.grid}`,
                  color: chartColors.text 
                }} 
              />
              <Legend wrapperStyle={{ color: chartColors.text }} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill={chartColors.pie[0]}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors.pie[index % chartColors.pie.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#424242' : '#fff',
                  border: `1px solid ${chartColors.grid}`,
                  color: chartColors.text 
                }} 
              />
              <Legend wrapperStyle={{ color: chartColors.text }} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <Box sx={{ p: 2 }}>
            <Typography>Unsupported chart type: {widget.chart_type}</Typography>
          </Box>
        );
    }
  };

  const renderGrid = () => {
    // Automatically generate columns from the first data item
    const columns = Object.keys(data[0] || {}).map(key => ({
      field: key,
      headerName: key.charAt(0).toUpperCase() + key.slice(1),
      flex: 1,
    }));

    return (
      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={data}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          getRowId={(row) => row.id || Math.random()}
        />
      </Box>
    );
  };

  const renderContent = () => {
    if (widget.widget_type === 'chart') {
      return renderChart();
    }

    return renderGrid();
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {renderContent()}
    </Box>
  );
};

export default WidgetContent;
