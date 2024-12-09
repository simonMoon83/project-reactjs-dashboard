import { Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Box, useTheme as useMuiTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Icons from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';

const DRAWER_WIDTH = 240;

const Sidebar = ({ menuItems }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();

  const getIcon = (iconName) => {
    const Icon = Icons[iconName];
    return Icon ? <Icon /> : <Icons.Circle />;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: isDarkMode ? muiTheme.palette.background.default : '#fff',
          borderRight: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            color: 'primary.main', 
            fontWeight: 'bold',
          }}
        >
          Dashboard
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.id}
            component="div"
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              cursor: 'pointer',
              color: isDarkMode ? 'text.primary' : 'inherit',
              '&.Mui-selected': {
                backgroundColor: isDarkMode ? 'primary.main' : 'rgba(0, 0, 0, 0.08)',
                color: isDarkMode ? '#fff' : 'text.primary',
                '& .MuiListItemIcon-root': {
                  color: isDarkMode ? '#fff' : 'text.primary',
                },
                '&:hover': {
                  backgroundColor: isDarkMode ? 'primary.dark' : 'rgba(0, 0, 0, 0.12)',
                },
              },
              '&:hover': {
                backgroundColor: isDarkMode ? 'action.hover' : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon 
              sx={{ 
                minWidth: 40,
                color: location.pathname === item.path 
                  ? (isDarkMode ? '#fff' : 'text.primary')
                  : (isDarkMode ? 'text.primary' : 'text.primary'),
                '& .MuiSvgIcon-root': {
                  fontSize: '1.5rem',
                }
              }}
            >
              {getIcon(item.icon)}
            </ListItemIcon>
            <ListItemText primary={item.title} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
