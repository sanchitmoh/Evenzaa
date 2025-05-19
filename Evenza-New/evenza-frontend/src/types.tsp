import { ReactNode } from "react";

// types.tsp
// Assuming this is in your types file (e.g., src/types.ts)
// src/types.ts
// src/types.ts
// src/types.ts
export interface Event { 
  id: string;          // Unique identifier for the event
  title: string;      // Title of the event
  description: string; // Description of the event
  date: string;       // Date of the event
  time: string;       // Time of the event
  venue: string;      // Venue where the event will take place
  price: number;      // Price of the event
  location: string;   // Location of the event
  category: string;   // Category of the event (e.g., concert, theater)
  imageUrl: string;   // URL for the event image
}

export interface Section {
  id: string;
  name: string;
  price: number;
  availableSeats: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'organizer';
}

export interface CartItem {
  eventId: string;
  quantity: number;
  sectionId?: string;
  price: number;
}

export interface Booking {
  id: string;
  eventId: string;
  userId: string;
  seats: string[];
  totalAmount: number;
  status: 'confirmed' | 'cancelled' | 'refunded';
  bookingDate: string;
}

// src/types.ts
export interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string;       // stored as JSON string like '["Action", "Drama"]'
  releaseDate: string;
  rating: number;
  imageUrl: string;
  duration: string;
  cast: string;        // stored as JSON string like '["Actor 1", "Actor 2"]'
  director: string;
  language: string;
  priceRange: string;
  location: string;
}

export interface Cast {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Coupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  minAmount?: number;
  maxDiscount?: number;
  validUntil: string;
}
// src/types.ts
export interface Seat {
  id: string; // Unique identifier for the seat
  row: string; // Row letter (e.g., 'A', 'B', etc.)
  number: number; // Seat number
  price: number; // Price of the seat
  status: 'available' | 'sold'; // Status of the seat
}
// types.ts
// types.ts
export interface Concert {
  id: string; // Unique identifier for the concert
  title: string; // Title of the concert
  description: string; // Description of the concert
  date: string; // Date of the concert (ISO format)
  time: string; // Time of the concert
  venue: string; // Venue where the concert is held
  price: number; // Price of the concert ticket
  location: string; // Location of the concert (city, state, etc.)
  category: string; // Category of the concert (e.g., pop, rock, etc.)
  imageUrl: string; // URL of the concert image
}
// types.ts
export interface SportEvent {
  id: string;            // Unique identifier for the event
  title: string;         // Title of the event
  description: string;   // Description of the event
  date: string;          // Date of the event in YYYY-MM-DD format
  time: string;          // Time of the event (e.g., HH:mm)
  venue: string;         // Venue where the event is held
  price: number;         // Price of the ticket
  location: string;      // Location of the event (city or place)
  category: string;      // Category of the sport (e.g., Football, Basketball)
  imageUrl: string;      // URL of the event image
}