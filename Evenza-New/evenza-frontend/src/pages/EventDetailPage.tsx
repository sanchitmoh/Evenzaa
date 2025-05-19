import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Event } from '../types'; // Adjust path as needed

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:8080/api/events/${id}`)
      .then(response => {
        setEvent(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching event:', error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!event) return <div className="text-center py-10">Event not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6">
        <img
          src={event.imageurl}
          alt={event.title}
          className="w-full h-96 object-cover rounded-md mb-6"
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center text-gray-700">
            <Calendar className="h-5 w-5 mr-2" />
            <span>{format(new Date(event.date), 'MMMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Clock className="h-5 w-5 mr-2" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <MapPin className="h-5 w-5 mr-2" />
            <span>{event.venue}</span>
          </div>
        </div>
        <p className="text-lg text-gray-800 mb-4">{event.description}</p>

<div className="mt-6">
 <Link
   to={
     // Normalize category to uppercase and check against standard values
     event.category.toUpperCase() === 'CONCERT'
       ? '/concertseat'
       : event.category.toUpperCase() === 'MOVIE' || event.category.toUpperCase() === 'THEATER'
       ? '/seat'
       : event.category.toUpperCase() === 'SPORT' || event.category.toUpperCase() === 'SPORTS'
       ? '/stadium'
       : '/' // Default fallback if category doesn't match
   }
   state={{ event }}
   className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors text-center block"
 >
    Book Tickets
  </Link>
</div>
      </div>
    </div>
  );
}
