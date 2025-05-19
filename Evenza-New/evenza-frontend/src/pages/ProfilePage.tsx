import React, { useState, useEffect } from 'react';
import { Ticket, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../config/firebase';
import TicketList from '../components/TicketList';
import ProfileForm from '../components/ProfileForm';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  memberSince: string;
}

interface Booking {
  id: string;
  bookingTime: string;
  entityType: string;
  entityName: string;
  seatNumber?: string;
  amount: number;
  status: string;
  seat: {
    row: string;
    number: string;
    section?: string;
  };
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    memberSince: new Date().getFullYear().toString()
  });
  
  const navigate = useNavigate();
  
  // Check for URL parameters to set active tab (useful when redirecting from booking)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const successParam = params.get('success');
    
    if (tabParam && ['profile', 'bookings', 'tickets'].includes(tabParam)) {
      setActiveTab(tabParam);
      
      // If success parameter is present and tab is tickets, show a success message
      if (successParam === 'true' && tabParam === 'tickets') {
        setSuccessMessage('Your booking was successful! Here are your tickets.');
        
        // Clear the success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // First check for JWT token authentication
      const token = localStorage.getItem('token');
      const storedUserData = localStorage.getItem('user');
      
      if (!token || !storedUserData) {
        // No JWT token auth, check Firebase
        const user = auth.currentUser;
      
        if (!user) {
          console.log("No user detected in Firebase or JWT, redirecting to login");
          // Redirect to login if not logged in
          navigate('/login', { state: { from: '/profile' } });
          return;
        }
        
        // Firebase auth only (no backend)
        console.log("Using Firebase auth only");
        setProfile({
          ...profile,
          id: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          memberSince: new Date(user.metadata.creationTime || Date.now()).getFullYear().toString()
        });
        setLoading(false);
        return;
      }
      
      // We have JWT token, try to use it to get profile
      try {
        // Try to parse stored user data
        const userData = JSON.parse(storedUserData);
        // Get user ID - use uid first, then fallback to numeric id
        const userId = userData.uid || userData.uuid || userData.userId || userData.id;
        
        // Log user ID and its type for debugging
        console.log(`Fetching profile for user ID: ${userId} using JWT, type: ${typeof userId}`);
        
        // Fetch user profile from backend with Authorization header
        try {
          console.log(`Attempting to fetch user profile with direct endpoint: /api/users/${userId}`);
          const response = await axios.get(`http://localhost:8080/api/users/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data) {
            console.log("Profile data received:", response.data);
            // Format the date to show only the year for memberSince
            const memberSince = new Date(response.data.createdAt || Date.now()).getFullYear().toString();
            
            setProfile({
              id: response.data.uid || userId,
              name: response.data.name || userData.name || '',
              email: response.data.email || userData.email || '',
              phone: response.data.phone || '',
              address: response.data.address || '',
              avatar: response.data.avatar || profile.avatar,
              memberSince
            });
          }
        } catch (directApiErr) {
          console.error('Direct profile endpoint failed, trying dashboard endpoint:', directApiErr);
          
          // If direct endpoint fails, try the dashboard endpoint
          try {
            console.log(`Attempting to fetch user profile with dashboard endpoint: /api/users/${userId}/dashboard`);
            const dashboardResponse = await axios.get(`http://localhost:8080/api/users/${userId}/dashboard`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (dashboardResponse.data && dashboardResponse.data.profile) {
              console.log("Dashboard profile data received:", dashboardResponse.data.profile);
              const profileData = dashboardResponse.data.profile;
              
              setProfile({
                id: profileData.id || userId,
                name: profileData.name || userData.name || '',
                email: profileData.email || userData.email || '',
                phone: profileData.phone || '',
                address: profileData.address || '',
                avatar: profileData.avatar || profile.avatar,
                memberSince: profileData.memberSince ? 
                  new Date(profileData.memberSince).getFullYear().toString() : 
                  new Date().getFullYear().toString()
              });
            } else {
              // Fallback to stored user data
              throw new Error("No profile data in dashboard response");
            }
          } catch (dashboardErr) {
            console.error('Dashboard endpoint also failed, falling back to stored data:', dashboardErr);
            
            // Fallback to stored user data if both endpoints fail
            try {
              const userData = JSON.parse(storedUserData);
              // Make sure the ID is properly converted to string if it's numeric
              const fallbackId = userData.id ? (typeof userData.id === 'number' ? userData.id.toString() : userData.id) : 'guest';
              setProfile({
                ...profile,
                id: fallbackId,
                name: userData.name || '',
                email: userData.email || '',
                memberSince: new Date().getFullYear().toString()
              });
            } catch (parseErr) {
              console.error('Error parsing stored user data:', parseErr);
              setError('Failed to load profile');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching profile with JWT:', err);
        // Fallback to stored user data
        try {
          const userData = JSON.parse(storedUserData);
          // Make sure the ID is properly converted to string if it's numeric
          const fallbackId = userData.id ? (typeof userData.id === 'number' ? userData.id.toString() : userData.id) : 'guest';
          setProfile({
            ...profile,
            id: fallbackId,
            name: userData.name || '',
            email: userData.email || '',
            memberSince: new Date().getFullYear().toString()
          });
        } catch (parseErr) {
          console.error('Error parsing stored user data:', parseErr);
          setError('Failed to load profile');
        }
      }
    } catch (err) {
      console.error('Error in profile loading:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Format date string to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  // Find the useEffect that loads user data
  useEffect(() => {
    // Add debugging code to log the user object structure
    try {
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('User object from localStorage:', userFromStorage);
      console.log('Available IDs:', {
        profileId: profile.id,
        storageId: userFromStorage.id,
        storageUserId: userFromStorage.userId,
        storageUuid: userFromStorage.uuid
      });
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
    }
  }, []);

  // Add this new function to fetch bookings
  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      setBookingsError(null);
      
      const token = localStorage.getItem('token');
      const storedUserData = localStorage.getItem('user');
      
      if (!token || !storedUserData) {
        throw new Error('Not authenticated');
      }
      
      const userData = JSON.parse(storedUserData);
      const userId = userData.uid || userData.uuid || userData.userId || userData.id;
      
      const response = await axios.get(`http://localhost:8080/api/bookings/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        setBookings(response.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookingsError('Failed to load booking history');
    } finally {
      setBookingsLoading(false);
    }
  };

  // Update the useEffect to fetch bookings when the bookings tab is active
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {successMessage}
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`mr-6 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`mr-6 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Booking History
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tickets'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tickets
            </button>
          </nav>
        </div>
        
        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <ProfileForm onUpdate={() => {
                // Refresh profile data after update
                fetchUserProfile();
              }} />
            </div>
          </div>
        )}
        
        {/* Booking History Tab Content */}
        {activeTab === 'bookings' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Ticket className="h-5 w-5 mr-2 text-indigo-500" />
                Booking History
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Your recent ticket bookings for movies, events, concerts, sports and more.
              </p>
            </div>
            
            {bookingsLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading booking history...</p>
              </div>
            ) : bookingsError ? (
              <div className="p-6 text-center text-red-500">
                {bookingsError}
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No booking history found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seat
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(booking.bookingTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.entityType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.entityName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.seat ? `${booking.seat.row}${booking.seat.number}${booking.seat.section ? ` - ${booking.seat.section}` : ''}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{booking.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Tickets Tab Content */}
        {activeTab === 'tickets' && (
          <TicketList 
            // Try all possible ID formats to ensure consistency
            userId={(() => {
              const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
              const backendFormatId = userFromStorage.uuid || userFromStorage.userId || userFromStorage.id;
              console.log('Using ticket userId:', backendFormatId || profile.id);
              return backendFormatId || profile.id;
            })()}
            showAll={true} 
          />
        )}
      </div>
    </div>
  );
}
