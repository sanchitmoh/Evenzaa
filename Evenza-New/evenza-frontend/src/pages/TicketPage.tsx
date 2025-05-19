import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Printer, CheckCircle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import TicketService from '../services/TicketService';

interface Ticket {
  id: string;
  bookingId: string;
  userId: string;
  userEmail: string;
  entityType: string;
  entityId: string;
  entityName: string;
  seatId: string;
  pdfUrl: string;
  qrCodeData: string;
  isUsed: boolean;
  eventDateTime: string;
  venue: string;
  createdAt: string;
  updatedAt?: string;
  price?: number;
  gate?: string;
}

const TicketPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  
  useEffect(() => {
    // Check for success parameter in URL
    const searchParams = new URLSearchParams(location.search);
    const successParam = searchParams.get('success');
    
    if (successParam === 'true') {
      setShowSuccessMessage(true);
      
      // Hide the success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.search]);
  
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!ticketId) {
          setError('Ticket ID is missing');
          setLoading(false);
          return;
        }
        
        // Check if we have tickets in localStorage
        const localTickets = JSON.parse(localStorage.getItem('mockTickets') || '[]');
        const cachedTickets = JSON.parse(localStorage.getItem('serverTickets') || '[]');
        
        // Try to find the ticket in local storage first
        const foundTicket = [...localTickets, ...cachedTickets].find(t => t.id === ticketId);
        
        if (foundTicket) {
          console.log('Ticket found in localStorage:', foundTicket);
          setTicket(foundTicket);
          setLoading(false);
          return;
        }
        
        // If not found in localStorage, try to fetch from API
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Authentication token not found');
          }
          
          // Use the correct API endpoint for fetching tickets
          const response = await fetch(`http://localhost:8080/api/tickets/${ticketId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Ticket not found');
            }
            throw new Error('Failed to fetch ticket');
          }
          
          const ticketData = await response.json();
          console.log('Fetched ticket data:', ticketData);
          setTicket(ticketData);
          
          // Cache the ticket in localStorage
          try {
            const cachedTickets = JSON.parse(localStorage.getItem('serverTickets') || '[]');
            if (!cachedTickets.find((t: Ticket) => t.id === ticketData.id)) {
              cachedTickets.push(ticketData);
              localStorage.setItem('serverTickets', JSON.stringify(cachedTickets));
            }
          } catch (cacheError) {
            console.error('Error caching ticket:', cacheError);
          }
        } catch (apiError) {
          console.error('Error fetching ticket from API:', apiError);
          setError(apiError instanceof Error ? apiError.message : 'Failed to load ticket');
        }
      } catch (err) {
        console.error('Error in fetchTicket:', err);
        setError('Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [ticketId]);
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    if (ticket) {
      TicketService.downloadTicket(ticket.id);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <button 
            onClick={() => navigate(-1)} 
            className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <div className="bg-white shadow rounded-lg p-6 text-center text-red-500">
            {error || 'Ticket not found'}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8" 
      style={{
        backgroundImage: "url('https://res.cloudinary.com/dyeviud0s/image/upload/v1746447880/back1_yu29bz.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
      <div className="max-w-5xl mx-auto px-4 print:px-0">
        {showSuccessMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg flex items-center shadow-sm">
            <CheckCircle className="h-5 w-5 mr-2" />
            <p>Payment successful! Here's your ticket.</p>
          </div>
        )}
        
        <div className="hidden print:block text-center text-xl font-bold mb-4">
          Your Ticket
        </div>
        
        <div className="print:hidden mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="mb-4 flex items-center text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-md"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          
          <div className="flex justify-end space-x-2">
            <button 
              onClick={handlePrint} 
              className="flex items-center px-3 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-800"
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </button>
            <button 
              onClick={handleDownload} 
              className="flex items-center px-3 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </button>
          </div>
        </div>
        
        {/* New Ticket Design */}
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden border-0 flex flex-col md:flex-row print:flex-row">
          {/* Left Section - Event Image */}
          <div className="md:w-1/2 print:w-1/2 relative">
            <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-70 text-white px-2 py-1 text-xs uppercase tracking-wider rounded">
              {ticket.entityType === 'MOVIE' ? 'MOVIE' : 
               ticket.entityType === 'CONCERT' ? 'LIVE MUSIC' : 
               ticket.entityType === 'SPORTS' ? 'SPORTS' : 'EVENT'}
            </div>
            <div 
              className="h-64 md:h-full print:h-full bg-center bg-cover" 
              style={{ 
                backgroundImage: ticket.entityType === 'MOVIE' ? 
                  "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1025&q=80')" :
                  ticket.entityType === 'CONCERT' ?
                  "url('https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80')" :
                  ticket.entityType === 'SPORTS' ?
                  "url('https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1007&q=80')" :
                  "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80')"
              }}
            >
            </div>
          </div>
          
          {/* Right Section - Ticket Details */}
          <div className="md:w-1/2 print:w-1/2 p-6 relative">
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-gray-800 mb-1">{ticket.entityName}</div>
              <div className="text-gray-600">
                {new Date(ticket.eventDateTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                <span className="mx-2">•</span>
                {formatTime(ticket.eventDateTime)}
              </div>
              <div className="text-gray-600 mt-1">
                {ticket.venue}
              </div>
            </div>
            
            <p className="text-gray-700 mb-4">{ticket.entityType === 'MOVIE' ? 
              'An immersive cinematic experience' : 
              ticket.entityType === 'CONCERT' ? 
              'An electrifying night of beats and energy!' : 
              ticket.entityType === 'SPORTS' ? 
              'Experience the thrill of live sports action' : 
              'A memorable event for all ages'}</p>
            
            <p className="font-semibold mb-1">Featuring:</p>
            <p className="text-gray-700 mb-4">{ticket.entityType === 'MOVIE' ? 
              'Top actors and stunning visuals' : 
              ticket.entityType === 'CONCERT' ? 
              'DJ Electron & Band' : 
              ticket.entityType === 'SPORTS' ? 
              'Championship Teams' : 
              'Special Guests'}</p>
            
            <ul className="mb-4 space-y-1">
              <li className="flex items-start">
                <span className="text-sm mr-2">•</span>
                <span className="text-gray-700">Free parking available</span>
              </li>
              <li className="flex items-start">
                <span className="text-sm mr-2">•</span>
                <span className="text-gray-700">Food and beverages included</span>
              </li>
              <li className="flex items-start">
                <span className="text-sm mr-2">•</span>
                <span className="text-gray-700">Entry starts at {formatTime(ticket.eventDateTime)}</span>
              </li>
            </ul>
            
            <div className="flex flex-wrap mb-4 gap-4">
              <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <span className="mr-2 font-medium">Date:</span>
                <span className="text-gray-700">{formatDate(ticket.eventDateTime)}</span>
              </div>
              <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <span className="mr-2 font-medium">Time:</span>
                <span className="text-gray-700">{formatTime(ticket.eventDateTime)}</span>
              </div>
              <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <span className="mr-2 font-medium">Price:</span>
                <span className="text-gray-700">
                  {ticket.price ? `₹${ticket.price}` : 'Free Entry'}
                </span>
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-4 flex justify-between items-center">
              <div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">SEAT</p>
                    <p className="text-xl font-bold">{ticket.seatId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ROW</p>
                    <p className="text-xl font-bold">
                      {ticket.seatId.match(/^[A-Z]/)?.[0] || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">GATE</p>
                    <p className="text-xl font-bold">
                      {ticket.gate || 'Main'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <QRCodeCanvas
                  value={ticket.qrCodeData || ticket.id}
                  size={90}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"}
                  includeMargin={false}
                />
                <div className="mt-2 text-xs font-mono text-gray-600">{ticket.id.substring(0, 8)}</div>
              </div>
            </div>
            
            {/* Barcode SVG */}
            <div className="mt-4 flex justify-center">
              <svg width="200" height="40" viewBox="0 0 200 40">
                <rect width="2" height="40" x="0" y="0" fill="black" />
                <rect width="1" height="40" x="6" y="0" fill="black" />
                <rect width="3" height="40" x="10" y="0" fill="black" />
                <rect width="1" height="40" x="16" y="0" fill="black" />
                <rect width="2" height="40" x="22" y="0" fill="black" />
                <rect width="3" height="40" x="28" y="0" fill="black" />
                <rect width="1" height="40" x="34" y="0" fill="black" />
                <rect width="3" height="40" x="40" y="0" fill="black" />
                <rect width="1" height="40" x="46" y="0" fill="black" />
                <rect width="2" height="40" x="52" y="0" fill="black" />
                <rect width="4" height="40" x="58" y="0" fill="black" />
                <rect width="1" height="40" x="66" y="0" fill="black" />
                <rect width="2" height="40" x="72" y="0" fill="black" />
                <rect width="3" height="40" x="78" y="0" fill="black" />
                <rect width="1" height="40" x="84" y="0" fill="black" />
                <rect width="4" height="40" x="90" y="0" fill="black" />
                <rect width="1" height="40" x="98" y="0" fill="black" />
                <rect width="2" height="40" x="104" y="0" fill="black" />
                <rect width="1" height="40" x="110" y="0" fill="black" />
                <rect width="3" height="40" x="116" y="0" fill="black" />
                <rect width="1" height="40" x="122" y="0" fill="black" />
                <rect width="2" height="40" x="128" y="0" fill="black" />
                <rect width="1" height="40" x="134" y="0" fill="black" />
                <rect width="3" height="40" x="140" y="0" fill="black" />
                <rect width="1" height="40" x="146" y="0" fill="black" />
                <rect width="2" height="40" x="152" y="0" fill="black" />
                <rect width="4" height="40" x="158" y="0" fill="black" />
                <rect width="1" height="40" x="166" y="0" fill="black" />
                <rect width="2" height="40" x="172" y="0" fill="black" />
                <rect width="3" height="40" x="178" y="0" fill="black" />
                <rect width="1" height="40" x="184" y="0" fill="black" />
                <rect width="2" height="40" x="190" y="0" fill="black" />
                <rect width="3" height="40" x="196" y="0" fill="black" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center text-sm text-white opacity-80 print:text-black">
          Please present this ticket at the event entrance. This ticket is valid for one entry only.
        </div>
      </div>
    </div>
  );
};

export default TicketPage; 