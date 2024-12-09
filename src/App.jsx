import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Box, CssBaseline, ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material'
import { ThemeProvider } from './context/ThemeContext'
import { useTheme } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

const ThemeWrapper = ({ children }) => {
  const { isDarkMode } = useTheme();
  
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

function App() {
  const [menuItems, setMenuItems] = useState([])

  useEffect(() => {
    fetch('http://localhost:3001/api/menu')
      .then(res => res.json())
      .then(data => setMenuItems(data))
  }, [])

  return (
    <ThemeProvider>
      <ThemeWrapper>
        <Router future={{ v7_startTransition: true }}>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar menuItems={menuItems} />
            <Box 
              component="main" 
              sx={{ 
                flexGrow: 1,
                padding: '20px',
                marginTop: '0'
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </ThemeWrapper>
    </ThemeProvider>
  )
}

export default App
