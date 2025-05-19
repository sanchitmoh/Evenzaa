import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, CreditCard, Music, Trophy, CalendarCheck, PieChart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { auth } from '../config/firebase';
import { format } from 'date-fns';

interface Booking {
  id: number;
  entityType: string;
  entityId: string;
  amount: number;
  bookingTime: string;
  status: string;
  entityName?: string;
}

interface Payment {
  id: number;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

interface DashboardData {
  upcomingEventsCount: number;
  pastEventsCount: number;
  totalSpent: number;
  upcomingEvents: Booking[];
  recentPayments: Payment[];
  eventTypesCount: number;
  bookingsByType: Record<string, number>;
  profile: {
    name: string;
    email: string;
  };
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check for JWT token auth first
        const token = localStorage.getItem('token');
        const storedUserData = localStorage.getItem('user');
        
        if (!token || !storedUserData) {
          // No JWT token, check Firebase
        const user = auth.currentUser;
        
        if (!user) {
            // No authentication at all, redirect to login
            navigate('/login', { state: { from: '/dashboard' } });
            return;
          }
          
          // Have Firebase auth but no JWT token
          setError('Please login with your account credentials to view dashboard');
          setLoading(false);
          return;
        }
        
        // Use the JWT token for authorization
        let userId;
        try {
          const userData = JSON.parse(storedUserData);
          userId = userData.id;
          
          console.log('Dashboard - User data from localStorage:', {
            id: userData.id,
            name: userData.name,
            role: userData.role
          });
          
          if (!userId) {
            throw new Error('User ID is missing from stored data');
          }
        } catch (parseErr) {
          console.error('Error parsing stored user data:', parseErr);
          navigate('/login', { state: { from: '/dashboard' } });
          return;
        }
        
        // Create empty dashboard data as fallback
        const emptyDashboardData: DashboardData = {
          upcomingEventsCount: 0,
          pastEventsCount: 0,
          totalSpent: 0,
          upcomingEvents: [],
          recentPayments: [],
          eventTypesCount: 0,
          bookingsByType: {},
          profile: {
            name: 'User',
            email: ''
          }
        };
        
        try {
        // Fetch dashboard data from backend
          console.log('Fetching dashboard data for user ID:', userId);
          const response = await axios.get(`http://localhost:8080/api/users/${userId}/dashboard`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            timeout: 10000 // 10 seconds timeout
          });
          
          console.log('Dashboard API response status:', response.status);
          console.log('Dashboard API response data:', response.data);
          
          if (!response.data || typeof response.data !== 'object') {
            console.error('Invalid dashboard data format:', response.data);
            setDashboardData(emptyDashboardData);
            setError('Failed to load dashboard data: Invalid response format');
            return;
          }
          
          // Check if upcomingEvents exists and is an array
          if (!response.data.upcomingEvents || !Array.isArray(response.data.upcomingEvents)) {
            console.error('Missing or invalid upcomingEvents in response:', response.data);
            setDashboardData(emptyDashboardData);
            setError('Failed to load dashboard data: Missing event data');
            return;
          }
        
        // Process bookings to add entity names
        const upcomingEventsWithNames = await Promise.all(
          response.data.upcomingEvents.map(async (booking: Booking) => {
              try {
                const entityName = await fetchEntityName(booking.entityType, booking.entityId, token);
            return { ...booking, entityName };
              } catch (err) {
                console.error('Error fetching entity name:', err);
                return { ...booking, entityName: 'Unknown' };
              }
          })
        );
        
        // Update dashboard data with entity names
        setDashboardData({
          ...response.data,
          upcomingEvents: upcomingEventsWithNames
        });
        } catch (apiErr: unknown) {
          console.error('Error fetching dashboard data:', apiErr);
          
          // Check if the error is an axios error with response property
          const axiosError = apiErr as AxiosError;
          if (axiosError.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('API Error details:', {
              status: axiosError.response.status,
              data: axiosError.response.data
            });
            
            if (axiosError.response.status === 401) {
              // Unauthorized - token may be invalid or expired
              localStorage.removeItem('token');
              navigate('/login', { state: { from: '/dashboard' } });
              return;
            }
          }
          
          // Fallback to empty dashboard data
          setDashboardData(emptyDashboardData);
          setError(`Failed to load dashboard data: ${axiosError.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Error in dashboard loading:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const fetchEntityName = async (entityType: string, entityId: string, token: string): Promise<string> => {
    try {
      let endpoint = '';
      switch (entityType) {
        case 'MOVIE':
          endpoint = `http://localhost:8080/api/movies/${entityId}`;
          break;
        case 'SPORTS':
          endpoint = `http://localhost:8080/api/sports/${entityId}`;
          break;
        case 'CONCERT':
          endpoint = `http://localhost:8080/api/concerts/${entityId}`;
          break;
        case 'EVENT':
          endpoint = `http://localhost:8080/api/events/${entityId}`;
          break;
        default:
          return 'Unknown';
      }
      
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.title || response.data.name || 'Unknown';
    } catch (err) {
      console.error('Error fetching entity details:', err);
      return 'Unknown';
    }
  };

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
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {dashboardData?.profile?.name || 'User'}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Ticket className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData?.upcomingEventsCount || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Past Events</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData?.pastEventsCount || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-semibold text-gray-900">₹{dashboardData?.totalSpent?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <CalendarCheck className="h-8 w-8 text-amber-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Event Categories</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData?.upcomingEvents ? 
                    new Set(dashboardData.upcomingEvents.map(event => event.entityType)).size : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
            </div>
            <div className="p-6">
              {dashboardData?.upcomingEvents && dashboardData.upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start p-4 border border-gray-200 rounded-md">
                      <div className={`flex-shrink-0 p-2 rounded-md ${
                        event.entityType === 'MOVIE' ? 'bg-indigo-100' : 
                        event.entityType === 'CONCERT' ? 'bg-pink-100' :
                        event.entityType === 'SPORTS' ? 'bg-amber-100' :
                        'bg-emerald-100'
                      }`}>
                        {event.entityType === 'MOVIE' ? (
                        <Ticket className="h-6 w-6 text-indigo-600" />
                        ) : event.entityType === 'CONCERT' ? (
                          <Music className="h-6 w-6 text-pink-600" />
                        ) : event.entityType === 'SPORTS' ? (
                          <Trophy className="h-6 w-6 text-amber-600" />
                        ) : (
                          <Calendar className="h-6 w-6 text-emerald-600" />
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center">
                        <h4 className="text-base font-medium text-gray-900">{event.entityName}</h4>
                          <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                            event.entityType === 'MOVIE' ? 'bg-indigo-100 text-indigo-800' :
                            event.entityType === 'CONCERT' ? 'bg-pink-100 text-pink-800' :
                            event.entityType === 'SPORTS' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {event.entityType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {format(new Date(event.bookingTime), 'PPP')} at {format(new Date(event.bookingTime), 'p')}
                        </p>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {event.status}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-medium text-gray-900">₹{event.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No upcoming events</p>
                </div>
              )}
              
              <div className="mt-6">
                <Link
                  to="/booking-history"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View all bookings
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
            </div>
            <div className="p-6">
              {dashboardData?.recentPayments && dashboardData.recentPayments.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-start p-4 border border-gray-200 rounded-md">
                      <div className="flex-shrink-0 bg-purple-100 p-2 rounded-md">
                        <CreditCard className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-base font-medium text-gray-900">{payment.paymentMethod}</h4>
                        <p className="text-sm text-gray-500">
                          {format(new Date(payment.createdAt), 'PPP')}
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === 'SUCCESS' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-medium text-gray-900">₹{payment.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No payment history</p>
                </div>
              )}
              
              <div className="mt-6">
                <Link
                  to="/payment-history"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View all payments
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-white rounded-lg shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center">
              <PieChart className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Events by Category</h3>
            </div>
          </div>
          <div className="p-6">
            {dashboardData?.bookingsByType && Object.keys(dashboardData.bookingsByType).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Ticket className="h-8 w-8 text-indigo-600" />
                      <h4 className="ml-2 text-lg font-medium text-gray-900">Movies</h4>
                    </div>
                    <span className="text-2xl font-bold text-indigo-600">
                      {dashboardData.bookingsByType['MOVIE'] || 0}
                    </span>
                  </div>
                </div>
                
                <div className="bg-pink-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Music className="h-8 w-8 text-pink-600" />
                      <h4 className="ml-2 text-lg font-medium text-gray-900">Concerts</h4>
                    </div>
                    <span className="text-2xl font-bold text-pink-600">
                      {dashboardData.bookingsByType['CONCERT'] || 0}
                    </span>
                  </div>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Trophy className="h-8 w-8 text-amber-600" />
                      <h4 className="ml-2 text-lg font-medium text-gray-900">Sports</h4>
                    </div>
                    <span className="text-2xl font-bold text-amber-600">
                      {dashboardData.bookingsByType['SPORTS'] || 0}
                    </span>
                  </div>
                </div>
                
                <div className="bg-emerald-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-emerald-600" />
                      <h4 className="ml-2 text-lg font-medium text-gray-900">Events</h4>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600">
                      {dashboardData.bookingsByType['EVENT'] || 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No booking statistics available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}