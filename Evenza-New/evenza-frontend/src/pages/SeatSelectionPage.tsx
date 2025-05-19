import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScreenShare as Screen, Info } from 'lucide-react';
import { Movie, Booking } from '../types';
import MissileLaunch from '../components/missile-launch';
import TicketService from '../services/TicketService';

// At the top of the file, add proper Razorpay type definitions
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: { color: string };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface Seat {
  id: string;
  row: string;
  number: number;
  category: 'PREMIUM' | 'EXECUTIVE' | 'STANDARD';
  price: number;
  status: 'available' | 'selected' | 'reserved' | 'sold';
}

const SEAT_LAYOUT = {
  PREMIUM: {
    rows: ['A', 'B', 'C'],
    seatsPerRow: 20,
    price: 350
  },
  EXECUTIVE: {
    rows: ['D', 'E', 'F', 'G', 'H'],
    seatsPerRow: 20,
    price: 280
  },
  STANDARD: {
    rows: ['I', 'J', 'K', 'L', 'M'],
    seatsPerRow: 20,
    price: 200
  }
} as const;

type SeatCategory = keyof typeof SEAT_LAYOUT;

// Define the RazorpayResponse interface for proper typing
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Add venue configuration
const VENUE_CONFIG = {
  MOVIE: {
    name: 'Evenza Cinema',
    location: '123 Entertainment Street, City Center',
    address: 'Ground Floor, Entertainment Plaza',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001'
  },
  THEATER: {
    name: 'Evenza Theater',
    location: '123 Entertainment Street, City Center',
    address: 'First Floor, Entertainment Plaza',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001'
  }
} as const;

export default function SeatSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const event = location.state?.event || location.state?.movie || null;  // Accept both event and movie
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const entityId = event?.id || new URLSearchParams(window.location.search).get('id') || 'default-id';
  const entityType = event?.category?.toUpperCase() || 'MOVIE';

  useEffect(() => {
    const storedUserData = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        setUserId(userData.uuid || userData.userId || userData.id?.toString() || 'guest');
      } catch {
        // do nothing
      }
    }
    if (storedToken) setToken(storedToken);
  }, []);

  useEffect(() => {
    const generateSeats = () => {
      const newSeats: Seat[] = [];
      (Object.entries(SEAT_LAYOUT) as [SeatCategory, typeof SEAT_LAYOUT[SeatCategory]][]).forEach(([category, layout]) => {
        layout.rows.forEach(row => {
          for (let i = 1; i <= layout.seatsPerRow; i++) {
            newSeats.push({
              id: `${row}${i}`,
              row,
              number: i,
              category,
              price: layout.price,
              status: 'available'
            });
          }
        });
      });
      setSeats(newSeats);
    };

    generateSeats();
  }, []);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'sold' || seat.status === 'reserved') return;
    const isSelected = selectedSeats.find(s => s.id === seat.id);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
      setSeats(seats.map(s => s.id === seat.id ? { ...s, status: 'available' } : s));
    } else if (selectedSeats.length < 10) {
      setSelectedSeats([...selectedSeats, seat]);
      setSeats(seats.map(s => s.id === seat.id ? { ...s, status: 'selected' } : s));
    }
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const getSeatColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300';
      case 'selected': return 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500';
      case 'sold': return 'bg-gray-400 text-gray-600 cursor-not-allowed border-gray-400';
      case 'reserved': return 'bg-yellow-100 text-yellow-800 cursor-not-allowed border-yellow-300';
      default: return 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  const getSeatTitle = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'selected': return 'Selected';
      case 'sold': return 'Sold';
      case 'reserved': return 'Reserved';
      default: return 'Available';
    }
  };

  const bookSeats = async () => {
    try {
      if (!userId) {
        alert('Please log in to book seats');
        navigate('/login');
        return;
      }

      if (!event) {
        alert('Event information is missing');
        return;
      }

      // Create order first
      const orderResponse = await fetch('http://localhost:8080/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: JSON.stringify({ amount: totalAmount })
      });
      const order = await orderResponse.json();

      // Create temporary reservations with full venue info
      const reservationData = {
        seatIds: selectedSeats.map(seat => seat.id),
        entityType: entityType,
        entityId: entityId,
        userId,
        amount: totalAmount,
        venue: JSON.stringify(
          entityType === 'THEATER' ? VENUE_CONFIG.THEATER : VENUE_CONFIG.MOVIE
        ),
        showTime: event?.showTime || event?.time || event?.date,
        screen: event?.screen || 'Screen 1'
      };

      const reservationResponse = await fetch('http://localhost:8080/api/bookings/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: JSON.stringify(reservationData)
      });

      if (!reservationResponse.ok) {
        const error = await reservationResponse.json();
        alert(error.error || 'Failed to reserve seats');
        return;
      }

      const reservationResult = await reservationResponse.json();
      const reservations = reservationResult.reservations;

      // Update UI to show seats as temporarily reserved
      const updatedSeats = seats.map(seat =>
        selectedSeats.find(s => s.id === seat.id)
          ? { ...seat, status: 'reserved' as const }
          : seat
      );
      setSeats(updatedSeats);

      // Proceed with payment
      const options: RazorpayOptions = {
        key: 'rzp_test_gI67fXiO9u1sAK',
        amount: order.amount,
        currency: order.currency,
        name: 'Movie Ticket Booking',
        description: `${event.title} - Seats: ${selectedSeats.map(s => s.id).join(', ')}`,
        order_id: order.id,
        handler: async function (response: RazorpayResponse) {
          setIsVerifying(true);
          try {
            // Verify payment
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: totalAmount,
              entityType: entityType,
              entityId: entityId,
              userId
            };

            const verifyRes = await fetch('http://localhost:8080/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
              body: JSON.stringify(verifyData)
            });

            if (!verifyRes.ok) {
              throw new Error('Payment verification failed');
            }

            const verifyResult = await verifyRes.json();

            if (verifyResult.valid) {
              // Confirm the reservations with full venue info
              const confirmData = {
                paymentId: response.razorpay_payment_id,
                reservationIds: (reservations as { id: string }[]).map(r => r.id.toString()),
                entityType: entityType,
                entityId: entityId,
                eventDateTime: event?.showTime || event?.time || event?.date,
                venue: JSON.stringify(
                  entityType === 'THEATER' ? VENUE_CONFIG.THEATER : VENUE_CONFIG.MOVIE
                ),
                entityName: event?.title,
                entityImage: event?.imageurl || event?.imageUrl
              };

              const confirmResponse = await fetch('http://localhost:8080/api/bookings/confirm-reservation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
                body: JSON.stringify(confirmData)
              });

              if (!confirmResponse.ok) {
                throw new Error('Failed to confirm reservations');
              }

              const confirmResult = await confirmResponse.json() as { bookings: Booking[], ticketId: string };

              // Update UI to show seats as sold
              const finalSeats = seats.map(seat =>
                selectedSeats.find(s => s.id === seat.id)
                  ? { ...seat, status: 'sold' as const }
                  : seat
              );
              setSeats(finalSeats);
              setSelectedSeats([]);

              // Store booking and payment info
              const currentBookings = JSON.parse(localStorage.getItem('userBookings') || '[]') as Booking[];
              currentBookings.push(...confirmResult.bookings.map((booking: Booking) => ({
                ...booking,
                bookingTime: new Date().toISOString(),
                userId,
                venue: VENUE_CONFIG.MOVIE.name, // Store venue name in bookings
                entityImage: event?.imageurl || event?.imageUrl // Store movie image in bookings
              })));
              localStorage.setItem('userBookings', JSON.stringify(currentBookings));

              const currentPayments = JSON.parse(localStorage.getItem('userPayments') || '[]');
              currentPayments.push({
                id: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                amount: totalAmount,
                status: 'SUCCESS',
                entityType: entityType,
                entityId: entityId,
                userId,
                paymentMethod: 'Razorpay',
                createdAt: new Date().toISOString(),
                venue: VENUE_CONFIG.MOVIE.name, // Store venue name in payments
                entityImage: event?.imageurl || event?.imageUrl // Store movie image in payments
              });
              localStorage.setItem('userPayments', JSON.stringify(currentPayments));

              // Generate ticket using TicketService with full venue info and image
              try {
                const venueData = entityType === 'THEATER' ? VENUE_CONFIG.THEATER : VENUE_CONFIG.MOVIE;

                // Format the event date time properly
                let eventDateTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default to 7 days from now
                if (event?.showTime) {
                  eventDateTime = new Date(event.showTime).toISOString();
                } else if (event?.time && event?.date) {
                  // Combine date and time
                  const dateTime = new Date(event.date);
                  const [hours, minutes] = event.time.split(':');
                  dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                  eventDateTime = dateTime.toISOString();
                }

                const ticketData = {
                  bookingId: confirmResult.bookings[0].id.toString(),
                  entityName: `${event.title} - Seats: ${selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}`,
                  venue: JSON.stringify({
                    ...venueData,
                    screen: event?.screen || 'Screen 1',
                    image: event?.imageurl || event?.imageUrl
                  }),
                  eventDateTime
                };

                // Generate ticket using TicketService with the correct number of arguments
                const ticket = await TicketService.generateTicket(
                  ticketData.bookingId,
                  ticketData.entityName,
                  ticketData.venue,
                  ticketData.eventDateTime
                );

                if (ticket) {
                  // If ticket generation was successful, redirect to ticket page
                  navigate(`/ticket/${ticket.id}?success=true`);
                  return;
                }

                // If ticket generation failed but we have a ticketId from the backend
                if (confirmResult.ticketId) {
                  navigate(`/ticket/${confirmResult.ticketId}?success=true`);
                  return;
                }

                // If we have bookings but no ticket, try to use the first booking ID
                if (confirmResult.bookings.length > 0) {
                  navigate(`/ticket/${confirmResult.bookings[0].id}?success=true`);
                  return;
                }

                // Last resort: redirect to profile
                alert('Booking successful! You can find your ticket in your profile.');
                navigate('/profile?tab=tickets&highlight=latest');

              } catch (ticketError) {
                console.error('Error generating ticket:', ticketError);
                // If ticket generation fails but we have a booking, still show success
                if (confirmResult.bookings.length > 0) {
                  alert('Booking successful! You can find your ticket in your profile.');
                  navigate('/profile?tab=tickets&highlight=latest');
                } else {
                  throw ticketError;
                }
              }

            } else {
              alert('Payment verification failed. Please contact support.');
            }

          } catch (error) {
            console.error('Payment process failed:', error);
            alert('Payment process failed. Please try again.');
          } finally {
            setIsVerifying(false);
          }
        },
        prefill: {
          name: 'Guest User',
          email: 'guest@example.com',
          contact: '9999999999'
        },
        theme: { color: '#6366f1' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Booking error:', error);
      alert('Something went wrong while booking seats. Please try again.');
    }
  };

  if (isVerifying) return <MissileLaunch />;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Select Your Seats</h1>
              {event && (
                <p className="text-gray-600 mt-1">
                  {event.title} - {event.screen || 'Screen 1'} - {event.showTime ? new Date(event.showTime).toLocaleTimeString() : 'Standard Show'}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-indigo-600 rounded mr-2"></div>
                <span className="text-sm">Selected</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
                <span className="text-sm">Sold</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
                <span className="text-sm">Reserved</span>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <div className="w-full h-4 bg-gradient-to-b from-gray-300 to-gray-200 rounded-t-lg"></div>
            <div className="flex justify-center my-8">
              <Screen className="h-8 w-8 text-gray-400" />
              <span className="ml-2 text-gray-500">Screen</span>
            </div>
          </div>
          <div className="space-y-8">
            {Object.entries(SEAT_LAYOUT).map(([category, layout]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{category}</h3>
                  <span className="text-gray-600">₹{layout.price}</span>
                </div>
                {layout.rows.map(row => (
                  <div key={row} className="flex items-center">
                    <span className="w-6 text-gray-500">{row}</span>
                    <div className="flex flex-nowrap overflow-x-auto">
                      {seats
                        .filter(seat => seat.row === row)
                        .map(seat => (
                          <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat)}
                            disabled={seat.status === 'sold' || seat.status === 'reserved'}
                            className={`w-10 h-10 rounded text-xs font-medium border border-gray-300 m-0.5 ${getSeatColor(seat.status)}`}
                            title={`${seat.row}${seat.number} - ₹${seat.price}`}
                          >
                            {seat.number}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600">Selected Seats: {selectedSeats.length}</p>
                <p className="text-sm text-gray-500">
                  {selectedSeats.map(seat => `${seat.row}${seat.number}`).join(', ')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">Total: ₹{totalAmount}</p>
                <button
                  onClick={bookSeats}
                  disabled={selectedSeats.length === 0}
                  className="mt-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Seat Status Guide:</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded border bg-white"></div>
                  <span>{getSeatTitle('available')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded border bg-indigo-600"></div>
                  <span>{getSeatTitle('selected')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded border bg-gray-400"></div>
                  <span>{getSeatTitle('sold')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded border bg-yellow-100 border-yellow-300"></div>
                  <span>{getSeatTitle('reserved')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
