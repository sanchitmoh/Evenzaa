import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import {Link} from "react-router-dom";
import { Concert } from '../types';

export default function ConcertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [concert, setConcert] = useState<Concert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`http://localhost:8080/api/concerts/${id}`)
      .then(response => {
        // Map the response to match our Concert type
        const concertData = {
          ...response.data,
          imageUrl: response.data.imageurl, // Map backend imageurl to frontend imageUrl
          category: response.data.category || 'CONCERT' // Ensure category is set
        };
        setConcert(concertData);
        setError(null);
      })
      .catch(error => {
        console.error('Error fetching concert:', error);
        setError('Failed to load concert details. Please try again later.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!concert) return <div className="text-center py-10">Concert not found.</div>;

  // Handle both imageUrl and imageurl fields
  const imageUrl = concert.imageUrl || concert.imageurl;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6">
        <img
          src={imageUrl}
          alt={concert.title}
          className="w-full h-96 object-cover rounded-md mb-6"
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{concert.title}</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center text-gray-700">
            <Calendar className="h-5 w-5 mr-2" />
            <span>{format(new Date(concert.date), 'MMMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Clock className="h-5 w-5 mr-2" />
            <span>{concert.time}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <MapPin className="h-5 w-5 mr-2" />
            <span>{concert.venue}</span>
          </div>
        </div>
        <p className="text-lg text-gray-800 mb-4">{concert.description}</p>

        <div className="mt-6">
          <Link
            to="/concertseat"
            state={{ concert }}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Book Tickets
          </Link>
        </div>
      </div>
    </div>
  );
}
