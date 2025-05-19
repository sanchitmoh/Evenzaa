import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:8080/api';

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
}

interface PaymentData {
  id: string;
  userId?: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface BookingData {
  id: number;
  userId?: string;
  entityType: string;
  entityId: string;
  seatId: string;
  paymentId?: string;
  amount: number;
  bookingTime?: string;
  status: string;
}

interface TicketStatus {
  status: 'PENDING' | 'COMPLETED' | 'ERROR' | 'NOT_FOUND';
  message: string;
  ticketId?: string;
  pdfUrl?: string;
  error?: string;
}

// Cache for ticket status polling
const ticketStatusCache: Record<string, { timestamp: number, retryCount: number }> = {};

// Helper function to normalize user ID format
const normalizeUserId = (userId: string | number): string => {
  // Always convert to string to ensure consistent handling
  return String(userId);
};

// Helper function to get entity name based on type
const getEntityName = (entityType?: string): string => {
  if (!entityType) return 'Event';
  
  switch (entityType.toUpperCase()) {
    case 'MOVIE':
      return 'Movie';
    case 'CONCERT':
      return 'Concert';
    case 'SPORTS':
      return 'Sports Event';
    case 'EVENT':
      return 'Event';
    default:
      return entityType;
  }
};

// Helper function to get default venue based on entity type
const getDefaultVenue = (entityType?: string): string => {
  if (!entityType) return 'Evenza Stadium';
  
  switch (entityType.toUpperCase()) {
    case 'MOVIE':
      return 'Evenza Cinema';
    case 'CONCERT':
      return 'Evenza Concert Hall';
    case 'SPORTS':
      return 'Evenza Stadium';
    case 'EVENT':
      return 'Evenza Convention Center';
    default:
      return 'Evenza Venue';
  }
};

export const TicketService = {
  /**
   * Get tickets for a specific user
   */
  getUserTickets: async (userId: string): Promise<Ticket[]> => {
    try {
      const normalizedUserId = normalizeUserId(userId);
      
      if (!normalizedUserId) {
        console.error('TicketService: Cannot fetch tickets - userId is empty');
        return [];
      }
      
      console.log(`TicketService: Fetching tickets for normalized user ID [${normalizedUserId}]`);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('TicketService: Authentication token not found, will try to use localStorage data');
        return TicketService.getMockTickets(normalizedUserId);
      }
      
      // Try to get tickets from API
      try {
        const response = await axios.get(`${API_URL}/tickets/user/${normalizedUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`TicketService: Received ${response.data.length} tickets from server`);
          
          // Update localStorage with the latest tickets from the server
          try {
            localStorage.setItem('serverTickets', JSON.stringify(response.data));
          } catch (err) {
            console.error('Failed to cache tickets in localStorage:', err);
          }
          
          return response.data;
        } else {
          console.warn('TicketService: Unexpected response format from server:', response.data);
          return [];
        }
      } catch (apiError) {
        console.error('Error fetching user tickets:', apiError);
        
        // If we get a 401 error or any other error, try to use localStorage as fallback
        console.log('API call failed, trying to load tickets from localStorage');
        return TicketService.getMockTickets(normalizedUserId);
      }
    } catch (error) {
      console.error('Error in getUserTickets:', error);
      return [];
    }
  },
  
  /**
   * Get mock tickets from localStorage
   */
  getMockTickets: async (userId: string): Promise<Ticket[]> => {
    try {
      const normalizedUserId = normalizeUserId(userId);
      console.log(`TicketService: Getting mock tickets for normalized user ID [${normalizedUserId}]`);
      
      // First check if we have server tickets cached
      const cachedServerTickets = localStorage.getItem('serverTickets');
      if (cachedServerTickets) {
        try {
          const parsedTickets = JSON.parse(cachedServerTickets) as Ticket[];
          // Filter by user ID - allowing for different formats
          const userTickets = parsedTickets.filter(t => 
            normalizeUserId(t.userId) === normalizedUserId
          );
          if (userTickets.length > 0) {
            console.log(`TicketService: Found ${userTickets.length} cached server tickets for user ${normalizedUserId}`);
            return userTickets;
          }
        } catch (e) {
          console.error('Error parsing cached server tickets:', e);
        }
      }
      
      // Next check if we already have mock tickets saved
      try {
        const savedMockTickets = localStorage.getItem('mockTickets');
        if (savedMockTickets) {
          const parsedTickets = JSON.parse(savedMockTickets) as Ticket[];
          // Filter by user ID
          const userTickets = parsedTickets.filter(t => t.userId === normalizedUserId);
          if (userTickets.length > 0) {
            console.log(`TicketService: Found ${userTickets.length} previously saved mock tickets for user ${normalizedUserId}`);
            return userTickets;
          }
        }
      } catch (e) {
        console.error('Error parsing saved mock tickets:', e);
      }
      
      // Create a mock ticket from localStorage payments and bookings
      const localPayments = JSON.parse(localStorage.getItem('userPayments') || '[]') as PaymentData[];
      const localBookings = JSON.parse(localStorage.getItem('userBookings') || '[]') as BookingData[];
      
      console.log(`TicketService: Found ${localPayments.length} payments and ${localBookings.length} bookings in localStorage`);
      
      // Filter by user ID - being careful with string conversions
      const userPayments = localPayments.filter((p) => 
        p.userId ? normalizeUserId(p.userId) === normalizedUserId : false
      );
      
      const userBookings = localBookings.filter((b) => 
        b.userId ? normalizeUserId(b.userId) === normalizedUserId : false
      );
      
      console.log(`TicketService: After filtering, found ${userPayments.length} payments and ${userBookings.length} bookings for user ${normalizedUserId}`);
      
      if (userBookings.length === 0) {
        console.warn('TicketService: No bookings found for this user');
        return [];
      }
      
      // Create mock tickets from booking and payment data
      const mockTickets: Ticket[] = userBookings.map((booking) => {
        // Generate a stable ticket ID from booking ID that won't change on refresh
        const stableId = `MOCK-TICKET-${booking.id}-${normalizedUserId.substring(0, 6)}`;
        
        // Set event date to 7 days from booking date if available, or from now
        const bookingDate = booking.bookingTime ? new Date(booking.bookingTime) : new Date();
        const eventDate = new Date(bookingDate);
        eventDate.setDate(eventDate.getDate() + 7);
        
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        const userEmail = userObj.email || 'user@example.com';
        
        return {
          id: stableId,
          bookingId: booking.id.toString(),
          userId: normalizedUserId,
          userEmail: userEmail,
          entityType: booking.entityType || 'EVENT',
          entityId: booking.entityId || '1',
          entityName: getEntityName(booking.entityType) + ' #' + booking.entityId,
          seatId: booking.seatId || 'A1',
          pdfUrl: '',
          qrCodeData: stableId,
          isUsed: false,
          eventDateTime: eventDate.toISOString(),
          venue: getDefaultVenue(booking.entityType),
          createdAt: booking.bookingTime || new Date().toISOString(),
          updatedAt: undefined
        };
      });
      
      console.log('TicketService: Generated mock tickets from localStorage:', mockTickets);
      
      // Save these mock tickets to localStorage for future use
      try {
        const existingMockTickets = JSON.parse(localStorage.getItem('mockTickets') || '[]') as Ticket[];
        const allMockTickets = [...existingMockTickets, ...mockTickets];
        localStorage.setItem('mockTickets', JSON.stringify(allMockTickets));
        console.log('TicketService: Saved mock tickets to localStorage for future use');
      } catch (err) {
        console.error('Failed to save mock tickets to localStorage:', err);
      }
      
      return mockTickets;
    } catch (err) {
      console.error('Error generating mock tickets:', err);
      return [];
    }
  },
  
  /**
   * Get upcoming tickets for a user
   */
  getUpcomingTickets: async (userId: string): Promise<Ticket[]> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('TicketService: Authentication token not found for upcoming tickets');
        // Get all tickets and filter client-side for upcoming ones
        const allTickets = await TicketService.getUserTickets(userId);
        return allTickets.filter(ticket => 
          !ticket.isUsed && new Date(ticket.eventDateTime) > new Date()
        );
      }
      
      try {
        const response = await axios.get(`${API_URL}/tickets/user/${userId}/upcoming`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return response.data;
      } catch (err) {
        console.error('Error fetching upcoming tickets from API:', err);
        // Fallback to filtering all tickets
        const allTickets = await TicketService.getUserTickets(userId);
        return allTickets.filter(ticket => 
          !ticket.isUsed && new Date(ticket.eventDateTime) > new Date()
        );
      }
    } catch (error) {
      console.error('Error getting upcoming tickets:', error);
      return [];
    }
  },
  
  /**
   * Get past tickets for a user
   */
  getPastTickets: async (userId: string): Promise<Ticket[]> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('TicketService: Authentication token not found for past tickets');
        // Get all tickets and filter client-side for past ones
        const allTickets = await TicketService.getUserTickets(userId);
        return allTickets.filter(ticket => 
          ticket.isUsed || new Date(ticket.eventDateTime) <= new Date()
        );
      }
      
      try {
        const response = await axios.get(`${API_URL}/tickets/user/${userId}/past`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return response.data;
      } catch (err) {
        console.error('Error fetching past tickets from API:', err);
        // Fallback to filtering all tickets
        const allTickets = await TicketService.getUserTickets(userId);
        return allTickets.filter(ticket => 
          ticket.isUsed || new Date(ticket.eventDateTime) <= new Date()
        );
      }
    } catch (error) {
      console.error('Error getting past tickets:', error);
      return [];
    }
  },
  
  /**
   * Download a ticket
   * This will open the ticket PDF in a new tab
   */
  downloadTicket: (ticketId: string): void => {
    // For mock tickets, show an alert
    if (ticketId.startsWith('MOCK-TICKET-')) {
      alert('This is a mock ticket generated from your booking data. PDF download is not available.');
      return;
    }
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Authentication required to download your ticket');
      return;
    }
    
    // Properly include the token in the request
    // Method 1: As a query parameter (most reliable for downloads)
    const downloadUrl = `${API_URL}/tickets/download/${ticketId}?token=${encodeURIComponent(token)}`;
    
    console.log('Opening ticket download URL:', downloadUrl);
    
    // Open ticket in new tab
    window.open(downloadUrl, '_blank');
  },
  
  /**
   * Parse and validate date string to ensure it's a valid date
   * @param dateStr The date string to parse
   * @returns A valid ISO date string
   */
  parseDateSafely: (dateStr: string): string => {
    try {
      // If it's already a valid ISO string, return it
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateStr)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }

      // Try parsing date and time separately
      if (dateStr.includes('T')) {
        const [dateOnly, timeOnly] = dateStr.split('T');
        const date = new Date(dateOnly);
        if (!isNaN(date.getTime())) {
          if (timeOnly) {
            const [hours, minutes] = timeOnly.split(':');
            date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
          }
          return date.toISOString();
        }
      }

      // Try parsing as a simple date string
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

      // If all parsing fails, return a date 7 days from now
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } catch (e) {
      console.warn('Failed to parse date:', dateStr, e);
      // Return a date 7 days from now as fallback
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  },
  
  /**
   * Generate a new ticket for a booking
   */
  generateTicket: async (bookingId: string, entityName: string, venue: string, eventDateTime: string): Promise<Ticket | null> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('TicketService: Authentication token not found for ticket generation');
        return null;
      }
      
      // Parse venue if it's a JSON string, otherwise use as is
      let venueData = venue;
      try {
        if (venue.startsWith('{')) {
          const parsedVenue = JSON.parse(venue);
          venueData = parsedVenue.name || parsedVenue.toString();
        }
      } catch (e) {
        console.warn('TicketService: Could not parse venue JSON, using raw string');
      }
      
      // Parse and validate the event date time
      const validatedDateTime = TicketService.parseDateSafely(eventDateTime);
      console.log('Parsed event date time:', validatedDateTime);
      
      const ticketData = {
        bookingId: bookingId.toString(), // Ensure bookingId is a string
        entityName,
        venue: venueData,
        eventDateTime: validatedDateTime
      };
      
      console.log('TicketService: Generating new ticket with data:', ticketData);
      
      const response = await axios.post(
        `${API_URL}/tickets/generate`, 
        ticketData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log('TicketService: Ticket generation response:', response.data);
      
      // If we get a ticketId back but not the full ticket object,
      // we should immediately fetch the ticket to return it
      if (response.data && response.data.ticketId) {
        try {
          // Add a small delay to ensure the ticket is saved in the database
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const ticketResponse = await axios.get(
            `${API_URL}/tickets/${response.data.ticketId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          console.log('TicketService: Fetched newly created ticket:', ticketResponse.data);
          
          // Cache the ticket in localStorage
          try {
            const cachedTickets = JSON.parse(localStorage.getItem('serverTickets') || '[]');
            if (!cachedTickets.find((t: Ticket) => t.id === ticketResponse.data.id)) {
              cachedTickets.push(ticketResponse.data);
              localStorage.setItem('serverTickets', JSON.stringify(cachedTickets));
            }
          } catch (cacheError) {
            console.error('Error caching ticket:', cacheError);
          }
          
          return ticketResponse.data;
        } catch (err) {
          console.error('Error fetching newly created ticket:', err);
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error generating ticket:', error);
      return null;
    }
  },

  /**
   * Check the status of an asynchronously generated ticket
   * @param bookingId The booking ID to check ticket status for
   * @param polling Whether to poll until ticket is ready (default: false)
   * @param maxRetries Maximum number of polling retries (default: 5)
   * @param retryInterval Interval between polls in ms (default: 2000)
   */
  checkTicketStatus: async (
    bookingId: string, 
    polling: boolean = false, 
    maxRetries: number = 5, 
    retryInterval: number = 2000
  ): Promise<TicketStatus> => {
    try {
      // Check cache to avoid too frequent API calls
      const now = Date.now();
      const cacheKey = `ticket_status_${bookingId}`;
      const cached = ticketStatusCache[cacheKey];
      
      // If there's a cached entry and it's recent, increment retry count
      if (cached && now - cached.timestamp < retryInterval && cached.retryCount >= maxRetries) {
        console.log(`Max retries (${maxRetries}) reached for booking ${bookingId}`);
        return {
          status: 'ERROR',
          message: 'Ticket generation timed out'
        };
      }
      
      // Make API call
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await axios.get(`${API_URL}/tickets/status/booking/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000 // 5 second timeout
      });
      
      const result = response.data as TicketStatus;
      
      // If polling is enabled and ticket is still pending
      if (polling && result.status === 'PENDING') {
        // Update cache
        ticketStatusCache[cacheKey] = {
          timestamp: now,
          retryCount: (cached?.retryCount || 0) + 1
        };
        
        // Check if we've reached max retries
        if ((cached?.retryCount || 0) + 1 >= maxRetries) {
          console.log(`Max retries (${maxRetries}) reached for booking ${bookingId}`);
          return {
            status: 'ERROR',
            message: 'Ticket generation timed out'
          };
        }
        
        // Wait for retry interval
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        
        // Recursive call to check again
        return TicketService.checkTicketStatus(bookingId, polling, maxRetries, retryInterval);
      }
      
      // Clear cache if we got a final result
      if (result.status !== 'PENDING') {
        delete ticketStatusCache[cacheKey];
      }
      
      return result;
    } catch (error: unknown) {
      console.error('Error checking ticket status:', error);
      
      // Extract error message for different error types
      let errorMsg = 'Failed to check ticket status';
      
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (axios.isAxiosError(error)) {
        // Handle Axios errors
        const axiosError = error as AxiosError<{ error?: string }>;
        errorMsg = axiosError.response?.data?.error || axiosError.message;
      }
      
      // If we're polling and got an error, we might retry
      if (polling) {
        const now = Date.now();
        const cacheKey = `ticket_status_${bookingId}`;
        const cached = ticketStatusCache[cacheKey] || { timestamp: now, retryCount: 0 };
        
        // Update cache with retry count
        cached.retryCount += 1;
        cached.timestamp = now;
        ticketStatusCache[cacheKey] = cached;
        
        // Check if we should retry
        if (cached.retryCount < maxRetries) {
          // Wait for retry interval
          await new Promise(resolve => setTimeout(resolve, retryInterval));
          
          // Recursive call to check again
          return TicketService.checkTicketStatus(bookingId, polling, maxRetries, retryInterval);
        }
      }
      
      return {
        status: 'ERROR',
        message: errorMsg
      };
    }
  }
};

export default TicketService; 