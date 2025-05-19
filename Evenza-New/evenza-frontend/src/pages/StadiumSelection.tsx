import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import TicketService from '../services/TicketService';
import { useLocation, useNavigate } from 'react-router-dom';
import MissileLaunch from '../components/missile-launch';

// Define types for Razorpay
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

// Razorpay interfaces
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
  theme: {
    color: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface Seat {
  id: string;
  row: string;
  number: number;
  isBooked: boolean;
}

interface Section {
  id: string;
  name: string;
  price: number;
  category: 'EXECUTIVE' | 'STANDARD';
  ring: 3 | 4;
  seats: Seat[];
  color: string;
}

function App() {
  // Get event data from location state
  const location = useLocation();
  const event = location.state?.event || location.state?.sportEvent;
  const [zoom, setZoom] = useState(1);
  const [bookedSeats, setBookedSeats] = useState<Set<string>>(new Set());
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Log event data to debug
  useEffect(() => {
    console.log('Event data from location state:', event);
  }, [event]);

  useEffect(() => {
    axios.get<string[]>('http://localhost:8080/api/bookings')
      .then(response => setBookedSeats(new Set(response.data)))
      .catch(err => console.error('Error fetching booked seats:', err));
  }, []);

  const generateSeats = (sectionId: string, rowCount: number, seatsPerRow: number): Seat[] => {
    const seats: Seat[] = [];
    const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, rowCount);
    rows.split('').forEach(row => {
      for (let i = 1; i <= seatsPerRow; i++) {
        const seatId = `${sectionId}-${row}${i}`;
        seats.push({
          id: seatId,
          row,
          number: i,
          isBooked: bookedSeats.has(seatId)
        });
      }
    });
    return seats;
  };

  const [sections] = useState<Section[]>(() => {
    const sectionTypes = [
      { ring: 3, category: 'EXECUTIVE', price: 2000, color: 'bg-blue-500', count: 16 },
      { ring: 4, category: 'STANDARD', price: 1000, color: 'bg-green-500', count: 20 }
    ];
    return sectionTypes.flatMap(type =>
      Array.from({ length: type.count }, (_, i) => {
        const id = `${type.category}-${i + 1}`;
        return {
          id,
          name: `${type.category} Section ${i + 1}`,
          price: type.price,
          category: type.category as Section['category'],
          ring: type.ring as Section['ring'],
          color: type.color,
          seats: generateSeats(id, 5, 20)
        };
      })
    );
  });

  const handleSectionClick = (section: Section) => {
    setSelectedSection(section);
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.isBooked) return;
    setSelectedSeats(prev =>
      prev.includes(seat.id) ? prev.filter(id => id !== seat.id) : [...prev, seat.id]
    );
  };

  const totalAmount = selectedSeats.reduce((total, seatId) => {
    const section = sections.find(s => seatId.includes(s.id));
    return total + (section?.price || 0);
  }, 0);

  const handlePayment = async () => {
    try {
      // Get event ID from location state or URL
      const eventId = event?.id || new URLSearchParams(window.location.search).get('id') || 'default-sport-id';
      
      console.log("Using event ID for booking:", eventId);
      
      // Enhanced user ID extraction with better fallbacks
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      let userId = null;
      
      // Try multiple possible user ID fields with better logging
      if (currentUser.id) {
        userId = typeof currentUser.id === 'number' ? currentUser.id.toString() : currentUser.id;
        console.log("Using user ID from id field:", userId);
      } else if (currentUser.uuid) {
        userId = currentUser.uuid;
        console.log("Using user ID from uuid field:", userId);
      } else if (currentUser.userId) {
        userId = typeof currentUser.userId === 'number' ? currentUser.userId.toString() : currentUser.userId;
        console.log("Using user ID from userId field:", userId);
      } else if (currentUser.email) {
        // Fallback to email if no ID is available
        userId = currentUser.email;
        console.log("Falling back to email as user ID:", userId);
      } else {
        userId = 'anonymous-' + Date.now().toString();
        console.log("No user ID found, using generated ID:", userId);
      }
      
      console.log("Creating payment order for amount:", totalAmount);
      
      // Make sure we have a valid auth token
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to make a payment. Please log in and try again.');
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        return;
      }
      
      const response = await axios.post('http://localhost:8080/api/payment/create-order', {
        amount: totalAmount // Pass the amount directly in INR
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Order created:", response.data);
      
      // Check if the order ID exists in the response
      if (!response.data.id) {
        console.error("No order ID in response:", response.data);
        alert('Could not create order. Please try again later.');
        return;
      }

      const options: RazorpayOptions = {
        key: 'rzp_test_gI67fXiO9u1sAK',
        amount: response.data.amount * 100, // Razorpay expects the amount in paise
        currency: 'INR',
        name: 'Seat Booking',
        description: 'Booking payment',
        order_id: response.data.id,
        handler: async function (res: RazorpayResponse) {
          setIsVerifying(true);
          try {
            // Add verification data
            console.log("Payment successful, verifying payment...", res);
            
            // Check if we have all required fields from Razorpay
            if (!res.razorpay_order_id || !res.razorpay_payment_id || !res.razorpay_signature) {
              console.error("Missing Razorpay response fields:", res);
              alert("Payment verification failed. Missing payment details from Razorpay.");
              setIsVerifying(false);
              return;
            }
            
            const verificationData = {
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
              amount: totalAmount.toString(),
              entityType: "SPORTS",
              entityId: eventId,
              userId: userId
            };
            
            console.log("Sending verification data:", verificationData);
            
            // Get a fresh token
            const currentToken = localStorage.getItem('token');
            if (!currentToken) {
              alert('Session expired. Please log in again.');
              window.location.href = '/login';
              setIsVerifying(false);
              return;
            }
            
            // Send verification data to backend
            const verifyRes = await axios.post('http://localhost:8080/api/payment/verify', verificationData, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
              }
            });
            
            console.log("Verification result:", verifyRes.data);
            
            if (verifyRes.data.valid) {
              // Create a comma-separated string of seat IDs
              const seatIdsString = selectedSeats.join(', ');
              
              // Format the booking data to match exactly what the backend expects
              const bookingData = {
                seatIds: selectedSeats,  // Send as array directly
                entityType: event?.category?.toUpperCase() || 'SPORT',
                entityId: eventId.toString(),
                userId: userId,
                paymentId: res.razorpay_payment_id,
                amount: Number(totalAmount),
                venue: "Evenza Stadium",
                bookingTime: new Date().toISOString()
              };
              
              console.log("Creating booking with data:", JSON.stringify(bookingData, null, 2));
              
              // Get latest token for authorization
              const bookingToken = localStorage.getItem('token');
              if (!bookingToken) {
                alert('Session expired. Please log in again.');
                window.location.href = '/login';
                return;
              }
              
              let bookingResponse;
              try {
                // Log request details for debugging
                console.log("Sending booking request with headers:", {
                  'Authorization': `Bearer ${bookingToken.substring(0, 10)}...`,
                  'Content-Type': 'application/json'
                });
                
                // Confirm the booking in the backend with proper headers and error handling
                bookingResponse = await axios.post(
                  'http://localhost:8080/api/bookings/confirm', 
                  bookingData,
                  {
                    headers: {
                      'Authorization': `Bearer ${bookingToken}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                console.log("Booking response:", bookingResponse);
              } catch (bookingErr) {
                // Get detailed error information
                const errorResponse = (bookingErr as AxiosError).response;
                if (errorResponse) {
                  console.error('Booking error details:', {
                    status: errorResponse.status,
                    statusText: errorResponse.statusText,
                    data: errorResponse.data
                  });
                  
                  // Show a more specific error message based on status code
                  if (errorResponse.status === 400) {
                    alert(`Booking failed - invalid data format. Details: ${JSON.stringify(errorResponse.data)}`);
                  } else if (errorResponse.status === 401 || errorResponse.status === 403) {
                    alert('Authentication failed. Please log in again.');
                    window.location.href = '/login';
                  } else {
                    alert(`Booking failed with status ${errorResponse.status}. Please contact support with your payment ID: ${res.razorpay_payment_id}`);
                  }
                } else {
                  console.error('Booking confirmation failed:', bookingErr);
                  alert('Booking confirmation failed. Please contact support with your payment ID: ' + res.razorpay_payment_id);
                }
                return;
              }
              
              if (bookingResponse.status === 200) {
                // Extract the first booking ID from the response
                let bookingId: string | undefined;
                if (bookingResponse.data.bookings && 
                    Array.isArray(bookingResponse.data.bookings) && 
                    bookingResponse.data.bookings.length > 0) {
                  bookingId = bookingResponse.data.bookings[0].id?.toString();
                  console.log('Extracted booking ID from response:', bookingId);
                }
                
                // Check if we have a valid booking ID
                if (!bookingId) {
                  console.error("No valid booking ID found in response:", bookingResponse.data);
                  alert('Booking confirmed but we couldn\'t generate a ticket automatically. Please check your profile later.');
                  window.location.href = '/profile?tab=bookings';
                  return;
                }
                
                // Store booking information in localStorage for access in profile page
                const currentBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
                
                currentBookings.push({
                  ...bookingData,
                  id: bookingId,
                  bookingTime: new Date().toISOString(),
                  userId: userId,
                  seatId: seatIdsString // Add the seat ID as a string
                });
                localStorage.setItem('userBookings', JSON.stringify(currentBookings));
                console.log(`Added booking to localStorage with userId: ${userId}`);

                // Store payment information in localStorage
                const currentPayments = JSON.parse(localStorage.getItem('userPayments') || '[]');
                currentPayments.push({
                  id: res.razorpay_payment_id,
                  razorpayOrderId: res.razorpay_order_id,
                  razorpayPaymentId: res.razorpay_payment_id,
                  amount: totalAmount,
                  status: 'SUCCESS',
                  entityType: "SPORTS",
                  entityId: eventId,
                  userId: userId,
                  paymentMethod: 'Razorpay',
                  createdAt: new Date().toISOString()
                });
                localStorage.setItem('userPayments', JSON.stringify(currentPayments));
                console.log(`Added payment to localStorage with userId: ${userId}`);
                
                // Generate a ticket for this booking
                try {
                  const bookingIdStr = bookingId.toString();
                  
                  console.log("Attempting to generate ticket for booking ID:", bookingIdStr);
                  
                  // Get sport event details if available (use placeholder if not)
                  // You can replace this with actual sport event data if available
                  const sportEventName = "Sports Event";
                  const venue = "Evenza Stadium";
                  
                  const ticketData = {
                    bookingId: bookingIdStr,
                    entityName: `${sportEventName} - Seats: ${seatIdsString}`,
                    venue: venue,
                    eventDateTime: event?.date && event?.time ? 
                      new Date(`${event.date}T${event.time}`).toISOString() : 
                      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                  };
                  
                  console.log("Generating ticket with data:", ticketData);
                  
                  const createdTicket = await TicketService.generateTicket(
                    ticketData.bookingId,
                    ticketData.entityName,
                    ticketData.venue,
                    ticketData.eventDateTime
                  );
                  
                  if (createdTicket) {
                    console.log("Ticket generated successfully:", createdTicket);
                    alert('Booking confirmed! Your ticket has been generated.');
                    // Redirect to the individual ticket page
                    window.location.href = `/ticket/${createdTicket.id}?success=true`;
                  } else {
                    console.log("TicketService couldn't generate the ticket, falling back to direct API call");
                    
                    // Fallback to direct API call
                    const ticketResponse = await axios.post(
                      'http://localhost:8080/api/tickets/generate',
                      ticketData,
                      { 
                        headers: { 
                          'Authorization': `Bearer ${bookingToken}`,
                          'Content-Type': 'application/json'
                        } 
                      }
                    );
                    
                    if (ticketResponse.status === 200) {
                      const ticketResult = ticketResponse.data;
                      console.log("Ticket generated successfully via direct API call:", ticketResult);
                      alert('Booking confirmed! Your ticket has been generated.');
                      // Redirect to individual ticket page if we have a ticket ID
                      if (ticketResult && ticketResult.id) {
                        window.location.href = `/ticket/${ticketResult.id}?success=true`;
                      } else {
                        window.location.href = '/profile?tab=tickets&highlight=latest';
                      }
                    } else {
                      console.error("Failed to generate ticket:", ticketResponse.data);
                      alert('Booking confirmed! You can find your booking in your profile.');
                      window.location.href = '/profile?tab=bookings';
                    }
                  }
                } catch (ticketError) {
                  console.error("Error in ticket generation:", ticketError);
                  alert('Booking confirmed but there was an issue generating your ticket. Please check your profile later.');
                  window.location.href = '/profile?tab=bookings';
                }
              } else {
                console.error('Booking failed:', bookingResponse.data);
                alert('Payment was successful, but booking failed. Please contact support.');
              }
            } else {
              // This should not happen if backend is configured correctly
              console.error('Payment verification returned invalid:', verifyRes.data);
              alert('Payment verification failed. Please contact support with ID: ' + res.razorpay_payment_id);
            }
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            alert('Payment verification failed. Please contact support with your payment ID: ' + res.razorpay_payment_id);
          } finally {
            setIsVerifying(false);
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#3399cc'
        }
      };

      console.log("Opening Razorpay with options:", options);
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment failed to start.');
    }
  };

  if (isVerifying) {
    return <MissileLaunch />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button 
              onClick={() => setZoom(z => Math.min(z + 0.2, 2))} 
              className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"
              aria-label="Zoom In"
              title="Zoom In">
              <ZoomIn size={20} />
            </button>
            <button 
              onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} 
              className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"
              aria-label="Zoom Out"
              title="Zoom Out">
              <ZoomOut size={20} />
            </button>
          </div>
          <div className="relative w-full aspect-square max-w-4xl mx-auto mb-8 overflow-hidden" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
            <div className="absolute inset-1/4 bg-green-700 rounded-full flex items-center justify-center">
              <div className="w-1/3 h-1/2 bg-green-600 border-2 border-white rounded-lg"></div>
            </div>
            <div className="absolute inset-0">
              {sections.map((section, index) => {
                const totalSections = sections.filter(s => s.ring === section.ring).length;
                const angle = (index % totalSections) * (360 / totalSections);
                const radius = 100 - (section.ring * 20);
                const left = `${50 + radius * Math.cos((angle - 90) * (Math.PI / 180))}%`;
                const top = `${50 + radius * Math.sin((angle - 90) * (Math.PI / 180))}%`;
                return (
                  <button
                    key={section.id}
                    className={`absolute w-16 h-16 ${section.color} rounded-lg transform -translate-x-1/2 -translate-y-1/2 hover:brightness-110 transition-all duration-200 cursor-pointer flex items-center justify-center text-xs font-bold ${selectedSection?.id === section.id ? 'ring-4 ring-white' : ''}`}
                    style={{ left, top }}
                    onClick={() => handleSectionClick(section)}
                  >
                    {section.id.split('-')[1]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {selectedSection && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-bold mb-4">{selectedSection.name}</h3>
            <div className="grid grid-cols-21 gap-1">
              <div className="col-span-1"></div>
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="text-center text-xs text-gray-400">{i + 1}</div>
              ))}
              {Array.from({ length: 5 }, (_, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <div className="flex items-center justify-center text-xs text-gray-400">
                    {String.fromCharCode(65 + rowIndex)}
                  </div>
                  {selectedSection.seats.filter(seat => seat.row === String.fromCharCode(65 + rowIndex)).map(seat => (
                    <button
                      key={seat.id}
                      className={`w-6 h-6 rounded-t-lg ${
                        seat.isBooked ? 'bg-gray-700 cursor-not-allowed' :
                        selectedSeats.includes(seat.id) ? 'bg-blue-500' :
                        'bg-gray-300 hover:bg-gray-400'
                      }`}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.isBooked}
                      aria-label={`Seat ${seat.id}`}
                      title={`Seat ${seat.id}`}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Selected Seats ({selectedSeats.length})</h2>
          <div className="mb-4">
            {selectedSeats.length > 0 ? (
              <ul className="space-y-2">
                {selectedSeats.map(seatId => {
                  const section = sections.find(s => seatId.includes(s.id));
                  return (
                    <li key={seatId} className="flex justify-between">
                      <span>{seatId}</span>
                      <span>₹{section?.price}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-400">No seats selected</p>
            )}
          </div>
          <div className="flex justify-between items-center font-bold text-lg border-t border-gray-700 pt-4">
            <span>Total Amount:</span>
            <span>₹{totalAmount}</span>
          </div>

          <button
            onClick={handlePayment}
            disabled={selectedSeats.length === 0}
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;