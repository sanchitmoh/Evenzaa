import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../config/firebase';
import { format } from 'date-fns';
import { CreditCard, ArrowLeft } from 'lucide-react';

interface Payment {
  id: number;
  bookingId: string;
  paymentId: string;
  orderId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        // Check if user is logged in
        const user = auth.currentUser;
        
        if (!user) {
          // Redirect to login if not logged in
          navigate('/login', { state: { from: '/payment-history' } });
          return;
        }
        
        // Get user ID from Firebase auth
        const userId = user.uid;
        
        // Fetch payments from backend
        const response = await axios.get(`http://localhost:8080/api/payments/user/${userId}`);
        setPayments(response.data);
        
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-8 flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-600">View all your payment transactions</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-12 text-sm font-medium text-gray-500">
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Payment ID</div>
              <div className="col-span-2">Method</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-3">Status</div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {payments.length > 0 ? (
              payments.map((payment) => (
                <div key={payment.id} className="px-6 py-4 grid grid-cols-12 items-center">
                  <div className="col-span-2 text-gray-900">
                    {format(new Date(payment.createdAt), 'PP')}
                  </div>
                  <div className="col-span-3 text-gray-900">
                    <p className="text-sm font-mono">{payment.paymentId}</p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{payment.paymentMethod}</span>
                  </div>
                  <div className="col-span-2 text-gray-900 font-medium">
                    ₹{payment.amount.toFixed(2)}
                  </div>
                  <div className="col-span-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === 'SUCCESS' 
                        ? 'bg-green-100 text-green-800' 
                        : payment.status === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-gray-500">No payment history found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}