import React, { useState, useEffect } from 'react';
import { Star as Stage, Users, User, Crown, Star, Users2 } from 'lucide-react';
import TicketService from '../services/TicketService';
import { useLocation, useNavigate } from 'react-router-dom';
import MissileLaunch from '../components/missile-launch';

// Define types for Razorpay
declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

interface RazorpayConstructor {
  new(options: RazorpayOptions): RazorpayInstance;
}

interface RazorpayInstance {
  open(): void;
}

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

interface SeatCategory {
  id: string;
  name: string;
  type: 'seated' | 'standing';
  price: number;
  color: string;
  icon: React.ElementType;
  available: number;
}

const categories: SeatCategory[] = [
  {
    id: 'table',
    name: "TABLE'S",
    type: 'seated',
    price: 5000,
    color: 'bg-amber-300',
    icon: Crown,
    available: 20
  },
  {
    id: 'mip',
    name: 'MIP',
    type: 'seated',
    price: 4000,
    color: 'bg-pink-300',
    icon: Star,
    available: 30
  },
  {
    id: 'vip',
    name: 'VIP',
    type: 'standing',
    price: 3000,
    color: 'bg-orange-200',
    icon: Users,
    available: 50
  },
  {
    id: 'gold',
    name: 'GOLD',
    type: 'standing',
    price: 2000,
    color: 'bg-yellow-400',
    icon: Users2,
    available: 100
  },
  {
    id: 'general',
    name: 'GENERAL',
    type: 'standing',
    price: 1000,
    color: 'bg-gray-300',
    icon: User,
    available: 200
  }
];

function App() {
  const navigate = useNavigate();
  // Get event data from location state
  const location = useLocation();
  const event = location.state?.event || location.state?.concert;
  const [selectedCategory, setSelectedCategory] = useState<SeatCategory | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Log event data to debug
  useEffect(() => {
    console.log('Event data from location state:', event);
  }, [event]);

  const handleProceedToPayment = async () => {
    if (!selectedCategory) {
      alert('Please select a seating category');
      return;
    }

    try {
      // Get event ID from location state or URL
      const concertId = event?.id || new URLSearchParams(window.location.search).get('id') || 'default-concert-id';
      console.log("Using concert ID for booking:", concertId);
      
      // Get current user from localStorage or your auth system
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log("Current user:", currentUser);

      // Use consistent user ID format - prefer UUID/string format if available
      const userId = currentUser.uuid || currentUser.userId || currentUser.id?.toString() || "guest";
      console.log("Using userId for payment and booking:", userId);

      // Get JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You need to be logged in to proceed with payment');
        navigate('/login');
        return;
      }

      const res = await fetch('http://localhost:8080/api/payment/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: selectedCategory.price })
      });

      if (!res.ok) {
        throw new Error(`Failed to create order: ${res.status} ${res.statusText}`);
      }

      const order = await res.json();
      console.log("Order created:", order);

      const options: RazorpayOptions = {
        key: 'rzp_test_gI67fXiO9u1sAK',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Concert Booking',
        description: `${selectedCategory.name} - Seat Booking`,
        order_id: order.id,
        handler: async function (response) {
          setIsVerifying(true);
          try {
            console.log("Payment successful, received Razorpay response:", response);
            
            // Send payment verification data to backend
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: selectedCategory.price,
              entityType: "CONCERT",
              entityId: concertId,
              userId: userId
            };
            
            console.log("Sending verification data:", verificationData);
            
            const verificationRes = await fetch('http://localhost:8080/api/payment/verify', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(verificationData)
            });
            
            if (!verificationRes.ok) {
              throw new Error(`Verification failed with status: ${verificationRes.status}`);
            }
            
            const verificationResult = await verificationRes.json();
            console.log("Verification result:", verificationResult);
            
            // Check if the verification was valid in the response
            if (verificationResult.valid) {
              // Generate a unique seat ID for this category booking
              const seatId = `CONCERT-${selectedCategory.id}-${Date.now()}`;
              
              console.log("Creating booking with seat ID:", seatId);
              
              // Prepare booking data
              const bookingData = {
                seatIds: [seatId],
                entityType: event?.category?.toUpperCase() || 'CONCERT',
                entityId: concertId,
                userId: userId,
                paymentId: response.razorpay_payment_id,
                amount: selectedCategory.price,
                venue: "Evenza Concert Hall"
              };
              
              console.log("Booking data:", bookingData);
              
              const bookingResponse = await fetch('http://localhost:8080/api/bookings/confirm', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
              });
              
              if (!bookingResponse.ok) {
                throw new Error(`Booking failed with status: ${bookingResponse.status}`);
              }
              
              const bookingResult = await bookingResponse.json();
              console.log("Booking result:", bookingResult);
              
              // Extract the first booking ID from the response
              let bookingId: string | undefined;
              if (bookingResult.bookings && Array.isArray(bookingResult.bookings) && bookingResult.bookings.length > 0) {
                bookingId = bookingResult.bookings[0].id?.toString();
                console.log('Extracted booking ID from response:', bookingId);
              }

              // Check if we have a valid booking ID
              if (!bookingId) {
                console.error("No valid booking ID found in response:", bookingResult);
                alert('Booking successful, but we couldn\'t generate a ticket automatically. Please check your profile later.');
                navigate('/profile?tab=bookings');
                return;
              }

              // Store booking information in localStorage for access in profile page
              const currentBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
              currentBookings.push({
                ...bookingData,
                id: bookingId,
                bookingTime: new Date().toISOString(),
                userId: userId
              });
              localStorage.setItem('userBookings', JSON.stringify(currentBookings));
              console.log(`Added booking to localStorage with userId: ${userId}`);

              // Store payment information in localStorage
              const currentPayments = JSON.parse(localStorage.getItem('userPayments') || '[]');
              currentPayments.push({
                id: Date.now(),
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                amount: selectedCategory.price,
                status: 'SUCCESS',
                entityType: "CONCERT",
                entityId: concertId,
                userId: userId,
                paymentMethod: 'Razorpay',
                createdAt: new Date().toISOString()
              });
              localStorage.setItem('userPayments', JSON.stringify(currentPayments));
              console.log(`Added payment to localStorage with userId: ${userId}`);
              
              // Directly generate the ticket using the TicketService
              console.log("Attempting to generate ticket via TicketService...");
              try {
                // We already have the bookingId from above, don't need to extract it again
                console.log("Using booking ID for ticket generation:", bookingId);
                
                // Format the event date time properly
                let eventDateTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default to 7 days from now
                if (event?.date && event?.time) {
                  // Combine date and time
                  const dateTime = new Date(event.date);
                  const [hours, minutes] = event.time.split(':');
                  dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                  eventDateTime = dateTime.toISOString();
                }
                
                // First, try using the TicketService
                const ticketData = {
                  bookingId: bookingId,
                  entityName: `Concert - ${selectedCategory.name}`,
                  venue: "Evenza Concert Hall",
                  eventDateTime
                };
                
                console.log("Generating ticket with data:", ticketData);
                
                // Import the service at the top of the file
                const createdTicket = await TicketService.generateTicket(
                  ticketData.bookingId,
                  ticketData.entityName,
                  ticketData.venue,
                  ticketData.eventDateTime
                );
                
                if (createdTicket) {
                  console.log("Ticket generated successfully via TicketService:", createdTicket);
                } else {
                  console.log("TicketService couldn't generate the ticket, falling back to direct API call");
                  
                  // Fallback to direct API call
                  const ticketResponse = await fetch('http://localhost:8080/api/tickets/generate', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(ticketData)
                  });
                  
                  if (ticketResponse.ok) {
                    const ticketResult = await ticketResponse.json();
                    console.log("Ticket generated successfully via direct API call:", ticketResult);
                  } else {
                    console.error("Failed to generate ticket with direct API call:", await ticketResponse.text());
                    
                    // Try alternative method if direct generation fails
                    console.log("Trying alternative ticket generation method...");
                    const alternativeTicketResponse = await fetch(`http://localhost:8080/api/tickets/generate-from-booking/${bookingId}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify(ticketData)
                    });
                    
                    if (alternativeTicketResponse.ok) {
                      console.log("Alternative ticket generation successful:", await alternativeTicketResponse.json());
                    } else {
                      console.error("All ticket generation attempts failed");
                      
                      // Even if ticket generation fails, we should at least let the user know their payment went through
                      alert('Payment successful but there was an issue generating your ticket. You can check your tickets later in your profile.');
                      navigate('/profile?tab=bookings');
                      return;
                    }
                  }
                }

                // Sleep for 1 second to ensure the backend has time to process the ticket
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                alert('Booking confirmed! Your ticket has been generated.');
                
                // Redirect to individual ticket page instead of profile page
                if (createdTicket && createdTicket.id) {
                  navigate(`/ticket/${createdTicket.id}?success=true`);
                } else {
                  // Fallback to profile tickets tab if we don't have a ticket ID
                  navigate('/profile?tab=tickets&highlight=latest');
                }
              } catch (ticketError) {
                console.error("Error in ticket generation:", ticketError);
                // Continue anyway - the ticket should have been generated by the backend
                alert('Payment successful but there was an issue generating your ticket. Your booking is confirmed.');
                navigate('/profile?tab=bookings');
              }
            } else {
              console.error("Payment verification failed:", verificationResult);
              throw new Error(verificationResult.error || 'Payment verification failed');
            }
          } catch (err: Error | unknown) {
            console.error('Payment verification process failed:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            alert('Payment verification failed. Please contact support with your payment ID: ' + 
                  response.razorpay_payment_id + '\nError: ' + errorMessage);
          } finally {
            setIsVerifying(false);
          }
        },
        prefill: {
          name: currentUser?.name || 'Guest User',
          email: currentUser?.email || 'guest@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#0d6efd',
        }
      };

      console.log("Opening Razorpay with options:", options);
      
      // Initialize Razorpay with the correct type
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: Error | unknown) {
      console.error('Payment initiation failed:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert('Something went wrong while initiating payment: ' + errorMessage);
    }
  };

  if (isVerifying) {
    return <MissileLaunch />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-black p-4 shadow-lg">
        <h1 className="text-2xl font-bold">Concert Seating Selection</h1>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stage display */}
        <div className="relative mb-12">
          <div className="w-full h-24 bg-gray-800 rounded-lg flex items-center justify-center mb-8">
            <Stage className="w-12 h-12" />
            <span className="ml-2 text-xl font-bold">STAGE</span>
          </div>
        </div>

        {/* Seating categories */}
        <div className="space-y-4 max-w-2xl mx-auto mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category)}
              className={`w-full p-4 rounded-lg transition-all duration-300 ${category.color} ${
                selectedCategory?.id === category.id
                  ? 'ring-4 ring-white ring-opacity-50 transform scale-102'
                  : 'hover:opacity-90'
              }`}
            >
              <div className="flex items-center justify-between text-black">
                <div className="flex items-center space-x-3">
                  <category.icon className="w-6 h-6" />
                  <div className="text-left">
                    <h3 className="font-bold text-lg">{category.name}</h3>
                    <p className="text-sm">
                      ({category.type === 'seated' ? 'Chair Seated' : 'Standing Area'})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{category.price}</p>
                  <p className="text-sm">{category.available} available</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Payment button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleProceedToPayment}
            disabled={!selectedCategory}
            className={`w-1/2 py-4 rounded-lg font-bold text-lg transition-all duration-300 flex items-center justify-center ${
              selectedCategory
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            Proceed to Payment
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
