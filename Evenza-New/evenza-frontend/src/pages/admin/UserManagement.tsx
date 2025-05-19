import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, Alert, CircularProgress } from '@mui/material';
import UsersTable from '../../components/admin/users-table';
import { getAllUsers } from '../../services/adminService';

interface User {
  id: string | number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getAllUsers();
        
        // Handle different response formats
        let userData: User[] = [];
        
        if (Array.isArray(response)) {
          userData = response;
        } else if (response && typeof response === 'object') {
          // Check for common API response formats
          if (Array.isArray(response.content)) {
            userData = response.content;
          } else if (Array.isArray(response.data)) {
            userData = response.data;
          } else if (Array.isArray(response.users)) {
            userData = response.users;
          } else if (response.items && Array.isArray(response.items)) {
            userData = response.items;
          } else {
            console.warn('Unexpected API response format:', response);
            userData = Object.values(response).filter(item => 
              item && typeof item === 'object' && 'id' in item && 'email' in item
            ) as User[];
          }
        }
        
        console.log('Processed user data:', userData);
        setUsers(userData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        User Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <UsersTable users={users} loading={loading} />
      )}
    </Paper>
  );
} 