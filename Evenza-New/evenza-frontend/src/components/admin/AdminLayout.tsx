import React, { useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  IconButton,
  Button,
  ListItemButton,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Dashboard,
  Event,
  Group,
  Settings,
  AccountCircle,
  Menu as MenuIcon,
  Notifications,
  Payments,
  Home,
  ExitToApp
} from '@mui/icons-material';
import { getToken, isTokenValid, getUserRoleFromToken, removeTokens, refreshToken } from '../../utils/authUtils';

const drawerWidth = 240;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'warning' | 'info' | 'success'
  });

  const handleLogout = useCallback(() => {
    removeTokens();
    navigate('/login', { state: { from: location.pathname } });
  }, [navigate, location.pathname]);

  const validateAdminAccess = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const isValid = await isTokenValid();
      if (!isValid) {
        // Try to refresh the token
        const refreshed = await refreshToken();
        if (!refreshed) {
          throw new Error('Session expired');
        }
        
        // Verify the new token is valid
        const newToken = getToken();
        if (!newToken || !(await isTokenValid(newToken))) {
          throw new Error('Invalid token after refresh');
        }
      }

      const userRole = getUserRoleFromToken();
      if (userRole !== 'ADMIN') {
        throw new Error('Unauthorized - Admin access required');
      }

      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Admin access validation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      handleLogout();
    }
  }, [handleLogout]);

  useEffect(() => {
    validateAdminAccess();
    
    // Set up interval to check token validity every minute
    const intervalId = setInterval(validateAdminAccess, 60000);
    
    return () => clearInterval(intervalId);
  }, [validateAdminAccess]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/admin',
    },
    {
      text: 'Event Management',
      icon: <Event />,
      path: '/admin/events',
    },
    {
      text: 'Users',
      icon: <Group />,
      path: '/admin/users',
    },
    {
      text: 'Transactions',
      icon: <Payments />,
      path: '/admin/transactions',
    },
    {
      text: 'Settings',
      icon: <Settings />,
      path: '/admin/settings',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Evenza Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
              sx={{
                bgcolor: isActive(item.path) ? 'primary.light' : 'transparent',
                color: isActive(item.path) ? 'primary.contrastText' : 'inherit',
                '&:hover': {
                  bgcolor: isActive(item.path) ? 'primary.light' : 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? 'primary.contrastText' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button
            component={Link}
            to="/"
            color="inherit"
            startIcon={<Home />}
            sx={{ mr: 2 }}
          >
            Back to Site
          </Button>
          <IconButton color="inherit">
            <Notifications />
          </IconButton>
          <IconButton color="inherit">
            <AccountCircle />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="admin navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}
      >
        <Toolbar /> {/* This creates space for the AppBar */}
        <Container 
          maxWidth="xl" 
          sx={{ 
            flexGrow: 1,
            py: 3,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          {children}
        </Container>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 