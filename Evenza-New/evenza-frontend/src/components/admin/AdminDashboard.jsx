import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Grid, Paper, Button, Card, CardContent,
  CardActions, Divider, CircularProgress, Alert
} from '@mui/material';
import { Event, Group, Payments, TrendingUp } from '@mui/icons-material';
import { getDashboardStats } from '../../services/adminService';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    totalRevenue: 0,
    eventStats: { events: 0, concerts: 0, movies: 0, sports: 0 }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Revenue Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color="textSecondary">Total Revenue</Typography>
                <TrendingUp color="primary" />
              </Box>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                ${stats.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                From {stats.successfulPayments} successful payments
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Users Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color="textSecondary">Total Users</Typography>
                <Group color="primary" />
              </Box>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                {stats.totalUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active users on the platform
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Bookings Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color="textSecondary">Total Bookings</Typography>
                <Payments color="primary" />
              </Box>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                {stats.totalBookings.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {stats.confirmedBookings} confirmed, {stats.cancelledBookings} cancelled
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Events Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color="textSecondary">Total Events</Typography>
                <Event color="primary" />
              </Box>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                {stats.eventStats.events.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {stats.eventStats.movies} movies, {stats.eventStats.concerts} concerts, {stats.eventStats.sports} sports
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Event Management Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Event Management
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h6">{stats.eventStats.movies}</Typography>
                    <Typography variant="body2" color="textSecondary">Movies</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h6">{stats.eventStats.concerts}</Typography>
                    <Typography variant="body2" color="textSecondary">Concerts</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h6">{stats.eventStats.sports}</Typography>
                    <Typography variant="body2" color="textSecondary">Sports</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              <Button 
                component={Link} 
                to="/admin/events" 
                variant="contained" 
                color="primary" 
                fullWidth
                startIcon={<Event />}
              >
                Manage Events
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* User Management Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                User & Transaction Management
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h6">{stats.totalUsers}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Users</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h6">{stats.totalPayments}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Transactions</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                component={Link} 
                to="/admin/users" 
                variant="outlined" 
                color="primary" 
                startIcon={<Group />}
                sx={{ flex: 1, mr: 1 }}
              >
                Manage Users
              </Button>
              <Button 
                component={Link} 
                to="/admin/transactions" 
                variant="outlined" 
                color="primary" 
                startIcon={<Payments />}
                sx={{ flex: 1, ml: 1 }}
              >
                View Transactions
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 