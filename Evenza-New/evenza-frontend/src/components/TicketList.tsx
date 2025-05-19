import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ticket, CalendarDays, MapPin, Download, QrCode, ArrowDownUp, Filter, RefreshCw, Eye } from 'lucide-react';
import TicketService from '../services/TicketService';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface TicketItem {
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
  eventImage?: string;
}

interface TicketListProps {
  userId: string;
}

const TicketList: React.FC<TicketListProps> = ({ userId }) => {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [highlightLatest, setHighlightLatest] = useState<boolean>(false);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<{
    userId: string;
    hasToken: boolean;
    tokenPrefix: string | null;
    storedUserId: string;
    idMatch: boolean;
  } | null>(null);
  const latestTicketRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Function to refresh tickets
  const refreshTickets = useCallback(() => {
    setRefreshCount(prev => prev + 1);
    setLoading(true);
  }, []);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        setUsingMockData(false);
        setDebugInfo(null);
        
        console.log(`TicketList: Fetching tickets for user ID [${userId}] (attempt #${refreshCount})`);
        
        if (!userId) {
          setError('User ID is missing. Cannot fetch tickets.');
          console.error('TicketList: User ID is missing');
          setLoading(false);
          return;
        }
        
        // Capture debug info about the user
        const token = localStorage.getItem('token');
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        const debugObj = {
          userId,
          hasToken: !!token,
          tokenPrefix: token ? token.substring(0, 10) + '...' : null,
          storedUserId: userObj.id,
          idMatch: userObj.id === userId
        };
        setDebugInfo(debugObj);
        console.log('TicketList Debug:', debugObj);
        
        const userTickets = await TicketService.getUserTickets(userId);
        console.log('TicketList: Received tickets:', userTickets);
        
        // Check if these are mock tickets generated from localStorage
        if (userTickets.length > 0 && userTickets[0].id.startsWith('MOCK-TICKET-')) {
          setUsingMockData(true);
          console.log('TicketList: Using mock data from localStorage');
        }
        
        setTickets(userTickets);
        setFilteredTickets(userTickets);

        // Check URL for highlight parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('highlight') === 'latest') {
          setHighlightLatest(true);
          // Set sort to show newest tickets first
          setSortBy('date');
          setSortDirection('desc');
          console.log('TicketList: Highlighting latest ticket');
        }
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Failed to load tickets from the server. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [userId, refreshCount]);

  // Scroll to latest ticket if highlighted
  useEffect(() => {
    if (highlightLatest && filteredTickets.length > 0 && latestTicketRef.current) {
      setTimeout(() => {
        latestTicketRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [highlightLatest, filteredTickets]);

  useEffect(() => {
    // Apply filters
    let result = [...tickets];
    
    // Filter by status
    if (filter === 'upcoming') {
      result = result.filter(ticket => 
        !ticket.isUsed && new Date(ticket.eventDateTime) > new Date()
      );
    } else if (filter === 'past') {
      result = result.filter(ticket => 
        ticket.isUsed || new Date(ticket.eventDateTime) <= new Date()
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.eventDateTime);
        const dateB = new Date(b.eventDateTime);
        return sortDirection === 'asc' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      } else {
        return sortDirection === 'asc'
          ? a.entityName.localeCompare(b.entityName)
          : b.entityName.localeCompare(a.entityName);
      }
    });
    
    setFilteredTickets(result);
  }, [tickets, filter, sortBy, sortDirection]);

  const handleDownload = (ticketId: string) => {
    // For mock tickets, display an alert instead of attempting to download
    if (ticketId.startsWith('MOCK-TICKET-')) {
      alert('This is a mock ticket generated from your booking data. PDF download is not available.');
      return;
    }
    
    TicketService.downloadTicket(ticketId);
  };

  const handleViewTicket = (ticketId: string) => {
    navigate(`/ticket/${ticketId}`);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPpp'); // Format: May 29, 2023, 12:30 PM
  };

  // Determine a color based on entityType
  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MOVIE':
        return 'bg-blue-100 text-blue-800';
      case 'CONCERT':
        return 'bg-purple-100 text-purple-800';
      case 'SPORTS':
        return 'bg-green-100 text-green-800';
      case 'EVENT':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (ticket: TicketItem) => {
    const now = new Date();
    const eventDate = new Date(ticket.eventDateTime);
    
    if (ticket.isUsed) {
      return 'bg-gray-100 text-gray-800'; // Used ticket
    } else if (eventDate < now) {
      return 'bg-red-100 text-red-800'; // Expired ticket
    } else if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'bg-yellow-100 text-yellow-800'; // Soon (less than 24 hours)
    } else {
      return 'bg-green-100 text-green-800'; // Valid ticket
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {error}
        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 text-left text-xs font-mono">
            <p>Debug Info:</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            <button 
              onClick={refreshTickets}
              className="mt-4 px-3 py-1 bg-indigo-500 text-white rounded text-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  if (filteredTickets.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No tickets found.
        <div className="mt-4 flex justify-center">
          <button 
            onClick={refreshTickets}
            className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </button>
        </div>
        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 text-left text-xs font-mono">
            <p>Debug Info:</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Ticket className="h-5 w-5 mr-2 text-indigo-500" />
            Your Tickets
          </h3>
          <button 
            onClick={refreshTickets}
            className="flex items-center px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </button>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Access and download your tickets for upcoming and past events.
        </p>
      </div>
      
      {/* Display success message when a new ticket has been generated */}
      {highlightLatest && filteredTickets.length > 0 && (
        <div className="bg-green-50 p-4 border-b border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Your ticket has been successfully generated and is ready to use!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Display notice when using mock data */}
      {usingMockData && (
        <div className="bg-yellow-50 p-4 border-b border-yellow-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Using locally stored data. These tickets are generated from your booking information and might not reflect server data.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Filter and sort controls */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-1 text-gray-500" />
          <span className="text-sm text-gray-500 mr-2">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'upcoming' | 'past')}
            className="text-sm border border-gray-300 rounded-md shadow-sm p-1"
            aria-label="Filter tickets"
          >
            <option value="all">All Tickets</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <ArrowDownUp className="h-4 w-4 mr-1 text-gray-500" />
          <span className="text-sm text-gray-500 mr-2">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
            className="text-sm border border-gray-300 rounded-md shadow-sm p-1 mr-2"
            aria-label="Sort tickets"
          >
            <option value="date">Date</option>
            <option value="name">Event Name</option>
          </select>
          <button
            onClick={toggleSortDirection}
            className="text-sm px-2 py-1 border border-gray-300 rounded-md shadow-sm"
          >
            {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>
      </div>
      
      {/* Tickets list */}
      <div className="bg-gray-50 p-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredTickets.map((ticket, index) => {
          const isLatest = index === 0 && highlightLatest && sortDirection === 'desc' && sortBy === 'date';
          
          return (
            <div
              key={ticket.id}
              ref={isLatest ? latestTicketRef : null}
              className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all duration-300 ${
                isLatest ? 'ring-2 ring-offset-2 ring-indigo-500 transform scale-105' : ''
              }`}
            >
              {/* Event Image */}
              <div className="relative h-48">
                <img
                  src={ticket.eventImage || '/default-event.jpg'}
                  alt={ticket.entityName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h4 className="text-lg font-semibold text-white line-clamp-2">{ticket.entityName}</h4>
                  <span className={`mt-2 px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getTypeColor(ticket.entityType)}`}>
                    {ticket.entityType}
                  </span>
                </div>
              </div>

              <div className="px-4 py-3">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  {formatDateTime(ticket.eventDateTime)}
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {ticket.venue}
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500">Seat</span>
                  <div className="text-sm font-medium text-gray-900">{ticket.seatId}</div>
                </div>
                
                <div className="flex space-x-2">
                  {ticket.qrCodeData && (
                    <button 
                      className="p-2 text-indigo-600 hover:text-indigo-900 rounded-md hover:bg-indigo-50" 
                      title="View QR Code"
                    >
                      <QrCode className="h-5 w-5" />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleViewTicket(ticket.id)}
                    className="p-2 text-indigo-600 hover:text-indigo-900 rounded-md hover:bg-indigo-50" 
                    title="View Ticket"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  
                  <button 
                    onClick={() => handleDownload(ticket.id)}
                    className="p-2 text-indigo-600 hover:text-indigo-900 rounded-md hover:bg-indigo-50" 
                    title="Download Ticket"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="px-4 py-2 border-t border-gray-200 flex justify-between items-center">
                <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(ticket)}`}>
                  {ticket.isUsed ? 'Used' : new Date(ticket.eventDateTime) < new Date() ? 'Expired' : 'Valid'}
                </span>
                <span className="text-xs text-gray-500">
                  Issued: {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Debug information at the bottom */}
      {debugInfo && (
        <div className="px-4 py-3 border-t border-gray-200 text-xs font-mono">
          <details>
            <summary className="text-gray-500 cursor-pointer">Debug Information</summary>
            <div className="mt-2 p-2 bg-gray-100 overflow-auto">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default TicketList; 