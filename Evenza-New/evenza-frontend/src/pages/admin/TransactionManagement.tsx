import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, Alert, CircularProgress } from '@mui/material';
import PaymentsTable from '../../components/admin/payments-table';
import { getAllPayments } from '../../services/adminService';

interface Payment {
  id: string | number;
  userId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  status: string;
  entityType?: string;
  entityId?: string;
  paymentMethod?: string;
  createdAt?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

export default function TransactionManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const response = await getAllPayments();
        
        // Handle different response formats
        let paymentData: Payment[] = [];
        
        if (Array.isArray(response)) {
          paymentData = response;
        } else if (response && typeof response === 'object') {
          // Check for common API response formats
          if (Array.isArray(response.content)) {
            paymentData = response.content;
          } else if (Array.isArray(response.data)) {
            paymentData = response.data;
          } else if (Array.isArray(response.payments)) {
            paymentData = response.payments;
          } else if (response.items && Array.isArray(response.items)) {
            paymentData = response.items;
          } else {
            console.warn('Unexpected API response format:', response);
            paymentData = Object.values(response).filter(item => 
              item && typeof item === 'object' && 'id' in item && 'amount' in item
            ) as Payment[];
          }
        }
        
        console.log('Processed payment data:', paymentData);
        setPayments(paymentData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Failed to load payment data. Please try again later.');
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Transaction Management
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
        <PaymentsTable payments={payments} loading={loading} />
      )}
    </Paper>
  );
} 