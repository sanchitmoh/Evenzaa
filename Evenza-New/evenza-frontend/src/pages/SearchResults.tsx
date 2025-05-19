import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

import EventCard from '../components/EventCard';
import MovieCard from '../components/MovieCard';
import ConcertCard from '../components/ConcertCard';
import SportCard from '../components/SportCard';

function SearchResults() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('query');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/search?query=${query}`);
        setResults(response.data);
        setError(null);
      } catch (error) {
        console.error("Error fetching search results", error);
        setError("Failed to load search results. Please try again.");
      }
    };

    if (query) fetchResults();
  }, [query]);

  const renderCard = (item: any) => {
    if (!item || !item.id || !item.category) {
      console.warn("Invalid item skipped:", item);
      return null;
    }

    const category = item.category.toLowerCase();

    switch (category) {
      case 'movie':
        return <MovieCard key={item.id} movie={item} />;
      case 'concert':
        return <ConcertCard key={item.id} concert={item} />;
      case 'sport':
        return <SportCard key={item.id} event={item} />;
      default:
        return <EventCard key={item.id} event={item} />;
    }
  };

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold mb-4">Search Results for "{query}"</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {results.length === 0 && !error ? (
          <p>No events found.</p>
        ) : (
          results.map(renderCard)
        )}
      </div>
    </div>
  );
}

export default SearchResults;
