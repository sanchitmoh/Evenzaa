import { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Event } from '../types';
import { format } from 'date-fns';

interface EventVideoCardProps {
  event: Event;
}

export default function EventVideoCard({ event }: EventVideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      to={`/events/${event.id}`} 
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02]">
        <div className="relative h-64">
          {isHovered && event.videoUrl ? (
            <ReactPlayer
              url={event.videoUrl}
              playing={true}
              muted={true}
              width="100%"
              height="100%"
              className="absolute top-0 left-0"
            />
          ) : (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-1 bg-indigo-600 rounded-full text-xs font-medium">
                {event.category}
              </span>
              <span className="text-sm font-medium">${event.price}</span>
            </div>
            <h3 className="text-xl font-bold mb-1">{event.title}</h3>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="text-sm">{format(new Date(event.date), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm">{event.time}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm">{event.venue}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}