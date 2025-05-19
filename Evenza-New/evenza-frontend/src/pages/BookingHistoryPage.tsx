import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../config/firebase';
import { format } from 'date-fns';
import { Ticket, Calendar, ArrowLeft, Music, Trophy } from 'lucide-react';

interface Booking {
  id: number;
  entityType: string;
  entityId: string;
  amount: number;
  bookingTime: string;
  status: string;
  entityName?: string;
  createdAt: string;
  seatId?: string;
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Check for JWT token auth first
        const token = localStorage.getItem('token');
        const storedUserData = localStorage.getItem('user');
        
        if (!token || !storedUserData) {
          // No JWT token, check Firebase
        const user = auth.currentUser;
        
        if (!user) {
            // No authentication at all, redirect to login
            navigate('/login', { state: { from: '/booking-history' } });
            return;
          }
          
          // Have Firebase auth but no JWT token
          setError('Please login with your account credentials to view booking history');
          setLoading(false);
          return;
        }
        
        // Use the JWT token for authorization
        let userId;
        try {
          const userData = JSON.parse(storedUserData);
          userId = userData.id;
        } catch (parseErr) {
          console.error('Error parsing stored user data:', parseErr);
          navigate('/login', { state: { from: '/booking-history' } });
          return;
        }
        
        // Fetch bookings from backend with token
        const response = await axios.get(`http://localhost:8080/api/bookings/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && Array.isArray(response.data)) {
        // Process bookings to add entity names
        const bookingsWithNames = await Promise.all(
          response.data.map(async (booking: Booking) => {
              const entityName = await fetchEntityName(booking.entityType, booking.entityId, token);
            return { ...booking, entityName };
          })
        );
        
        setBookings(bookingsWithNames);
        } else {
          console.error('Invalid response format:', response.data);
          setError('Failed to load booking history: Invalid data format');
        }
        
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load booking history');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
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
        
        <div className="mb-8 flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking History</h1>
            <p className="text-gray-600">View all your past and upcoming bookings</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-12 text-sm font-medium text-gray-500">
              <div className="col-span-4">Event</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Time</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div key={booking.id} className="px-6 py-4 grid grid-cols-12 items-center">
                  <div className="col-span-4 flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      {booking.entityType === 'MOVIE' ? (
                        <Ticket className="h-6 w-6 text-indigo-600" />
                      ) : booking.entityType === 'CONCERT' ? (
                        <Music className="h-6 w-6 text-pink-600" />
                      ) : booking.entityType === 'SPORTS' ? (
                        <Trophy className="h-6 w-6 text-amber-600" />
                      ) : (
                        <Calendar className="h-6 w-6 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium text-gray-900">{booking.entityName || 'Unknown Event'}</p>
                        <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                          booking.entityType === 'MOVIE' ? 'bg-indigo-100 text-indigo-800' :
                          booking.entityType === 'CONCERT' ? 'bg-pink-100 text-pink-800' :
                          booking.entityType === 'SPORTS' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {booking.entityType}
                        </span>
                      </div>
                      {booking.seatId && (
                        <p className="text-sm text-gray-500">Seat ID: {booking.seatId}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-gray-900">
                    {format(new Date(booking.bookingTime), 'PP')}
                  </div>
                  <div className="col-span-2 text-gray-900">
                    {format(new Date(booking.bookingTime), 'p')}
                  </div>
                  <div className="col-span-2 text-gray-900">
                    ₹{booking.amount.toFixed(2)}
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      booking.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800' 
                        : booking.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-gray-500">No bookings found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}