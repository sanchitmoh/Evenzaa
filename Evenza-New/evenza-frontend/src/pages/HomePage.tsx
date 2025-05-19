import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import EventVideoCard from '../components/EventVideoCard';
import type { Event } from '../types';
import { Music, Trophy, Theater, Clock, Ticket } from 'lucide-react';
import NewsletterService from '../services/NewsletterService';

// Unified mock events for all categories
const MOCK_EVENTS: Event[] = [
  {
    id: '8',
    title: 'Les Misérables',
    description: 'Experience the powerful story of Les Misérables.',
    date: '2024-10-10',
    time: '18:00',
    venue: 'West End Theater, London',
    location: 'London',
    category: 'theater',
    imageUrl: 'https://res.cloudinary.com/dyeviud0s/image/upload/v1746116735/13872-les-miserables__iyg1a2.jpg',
  },
  {
    id: '9',
    title: 'Concert: Acoustic Evening',
    description: 'An intimate evening of acoustic performances by local artists.',
    date: '2024-10-20',
    time: '19:00',
    venue: 'Cafe, San Francisco',
    location: 'San Francisco',
    category: 'Concert',
    imageUrl: 'https://t4.ftcdn.net/jpg/08/52/43/17/360_F_852431753_mSZMX9iaxe7pIBjY4SB8pOwEc0qDR2iZ.jpg',
  },
  {
    id: '10',
    title: 'Romeo and Juliet',
    description: 'A timeless tale of love and tragedy performed live.',
    date: '2024-11-01',
    time: '19:30',
    venue: 'Shakespeare Theater, London',
    location: 'London',
    category: 'theater',
    imageUrl: 'https://webapp2.wright.edu/web1/newsroom/files/2014/11/RomeoAndJuliet2.jpg',
  },
  {
    id: '11',
    title: 'Kanye West: Donda Tour',
    description: 'Catch Kanye West live on his Donda tour!',
    date: '2024-09-20',
    time: '20:00',
    venue: 'United Center, Chicago',
    location: 'Chicago',
    category: 'Concert',
    imageUrl: 'https://www.usatoday.com/gcdn/-mm-/98c88f66dedc33e13e6cc28e741e44d38281b35f/c=0-0-2760-2075/local/-/media/2016/11/21/USATODAY/USATODAY/636153602053989898-538401266.jpg',
  },
  {
    id: '12',
    title: 'The Nutcracker',
    description: 'A magical ballet performance perfect for the holiday season.',
    date: '2024-12-01',
    time: '15:00',
    venue: 'Ballet Theater, Chicago',
    location: 'Chicago',
    category: 'theater',
    imageUrl: 'https://nevadaballetorg-1faa6.kxcdn.com/wp-content/uploads/2024/06/NBT-TheNutcracker-TSC-Website-Image-864x490-1-1.jpg',
  },
];

// Event categories for navigation buttons
const CATEGORIES = [
  { id: 'all', label: 'All Events', icon: Music, link: '/events' },
  { id: 'concert', label: 'Concerts', icon: Music, link: '/concert' },
  { id: 'sports', label: 'Sports', icon: Trophy, link: '/sport' },
  { id: 'movies', label: 'Movies', icon: Theater, link: '/movies' },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [email, setEmail] = useState<string>('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const navigate = useNavigate();

  // ✅ Redirect search to unified /search page
  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query)}`);
    }
  };

  // Handle newsletter subscription
  const handleSubscribe = async () => {
    if (!email.trim()) {
      setSubscriptionStatus({
        message: 'Please enter a valid email address',
        isError: true
      });
      return;
    }

    setIsSubscribing(true);
    setSubscriptionStatus(null);
    
    try {
      const response = await NewsletterService.subscribe(email);
      setSubscriptionStatus({
        message: response.message || 'Successfully subscribed to the newsletter!',
        isError: false
      });
      setEmail(''); // Clear the email field on success
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setSubscriptionStatus({
        message: 'Failed to subscribe. Please try again later.',
        isError: true
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const latestEvents: Event[] = MOCK_EVENTS.slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
       {/* Hero Section */}
       <div className="relative min-h-[100dvh] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source
            src="https://res.cloudinary.com/dyeviud0s/video/upload/v1746451295/gif4_ocw3nq.mp4"
            type="video/mp4"
          />
          <source
            src="https://res.cloudinary.com/dyeviud0s/video/upload/v1746451295/gif4_ocw3nq.webm"
            type="video/webm"
          />
          Your browser does not support the video tag.
        </video>

        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10"></div>

        <div className="relative z-20 flex items-center justify-center min-h-[100dvh] px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl w-full flex flex-col items-center space-y-4 sm:space-y-6">
            <h6 className="text-2xl sm:text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-fade-in-up flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <Ticket className="w-6 h-8 sm:w-8 sm:h-10 text-yellow-400 animate-bounce" />
              <span className="mt-2 sm:mt-0">Live It Loud with Evenza</span>
            </h6>

            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto animate-fade-in-up stagger-delay-1 italic px-4">
              Discover and book the most exciting events happening around you
            </p>

            <div className="w-full max-w-xl px-4 animate-fade-in-up stagger-delay-2">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        </div>
      </div>

      {/* Latest Events Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Latest Events</h2>
          </div>
          <Link to="/events" className="text-indigo-400 hover:text-indigo-300 text-sm sm:text-base">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {latestEvents.map((event, index) => (
            <div key={event.id} className={`animate-scale-in stagger-delay-${index + 1}`}>
              <EventVideoCard event={event} />
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8 sm:mb-12 animate-fade-in-up stagger-delay-3 px-4 sm:px-0">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={category.link}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 flex items-center space-x-2 text-sm sm:text-base ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 scale-105'
                    : 'glass-effect text-white hover:bg-white/20'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{category.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mb-8 sm:mb-12">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Stay Updated</h3>
            <p className="text-sm sm:text-base text-gray-300">
              Subscribe to our newsletter for the latest events and exclusive offers
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-xl mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 sm:py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
            />
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="px-6 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isSubscribing ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>

          {subscriptionStatus && (
            <div className={`mt-4 text-center text-sm ${subscriptionStatus.isError ? 'text-red-400' : 'text-green-400'}`}>
              {subscriptionStatus.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
