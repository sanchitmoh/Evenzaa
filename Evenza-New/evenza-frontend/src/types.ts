export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  price: number;
  image?: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  releaseDate: string;
  language: string;
  price: number;
  image?: string;
  screen?: string;
  showTime?: string;
}

export interface Booking {
  id: string;
  seatId: string;
  entityType: string;
  entityId: string;
  userId: string;
  paymentId?: string;
  amount: number;
  status: string;
  venue?: string;
  bookingTime: string;
}

export interface Sport {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  price: number;
  location: string;
  imageurl?: string;
  sportType: string;
  teams: string;
  league: string;
  season?: string;
  capacity?: number;
}

export interface SportFormData {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  price: number | string;
  location: string;
  category?: string;
  imageUrl?: string;
  sportType: string;
  teams: string;
  league: string;
  season?: string;
  capacity?: number | string;
}

export interface MovieFormData {
  id?: string;
  title: string;
  description: string;
  releaseDate?: string | null;
  date: string;
  time: string;
  duration?: string;
  language?: string;
  screen?: string;
  category?: string;
  price: number | string;
  venue: string;
  location: string;
  imageUrl?: string;
  cast?: string;
  director?: string;
}

export interface ConcertFormData {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  price: number | string;
  location: string;
  category?: string;
  imageUrl?: string;
  artist?: string;
  openingAct?: string;
  duration?: string;
  capacity?: number | string;
}

export interface EventFormProps {
  eventType: 'sport' | 'movie' | 'concert';
  isEditMode?: boolean;
  initialData?: SportFormData | MovieFormData | ConcertFormData;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface EventsResponse extends PaginatedResponse<Event> {}
export interface MoviesResponse extends PaginatedResponse<Movie> {}
export interface ConcertsResponse extends PaginatedResponse<Event> {}
export interface SportsResponse extends PaginatedResponse<Sport> {}

export interface EventData {
  id?: string;
  title: string;
  description: string;
  date?: string;
  time?: string;
  venue?: string;
  category?: string;
  price: number | string;
  location?: string;
  imageUrl?: string;
}

export interface MovieData {
  id?: string;
  title: string;
  description: string;
  releaseDate?: string | null;
  date?: string | null;
  time?: string;
  duration?: string;
  language?: string;
  screen?: string;
  category?: string;
  price: number | string;
  venue: string;
  location: string;
  imageUrl?: string;
  cast?: string;
  director?: string;
}

export interface ConcertData {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  price: number | string;
  location: string;
  category?: string;
  imageUrl?: string;
  artist?: string;
  openingAct?: string;
} 