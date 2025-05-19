import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Calendar } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  // Parse genre safely - handle both JSON array strings and regular comma-separated strings
  let parsedGenre: string[] = [];
  
  try {
    // Check if it's already a string array
    if (Array.isArray(movie.genre)) {
      parsedGenre = movie.genre;
    } 
    // Try to parse as JSON
    else if (typeof movie.genre === 'string') {
      // First, check if it's a JSON array string (starts with [ and ends with ])
      if (movie.genre.trim().startsWith('[') && movie.genre.trim().endsWith(']')) {
        parsedGenre = JSON.parse(movie.genre);
      } 
      // Otherwise, treat it as a comma-separated string
      else {
        parsedGenre = movie.genre.split(',').map(g => g.trim());
      }
    }
  } catch (err) {
    console.warn("Error parsing movie genre:", err);
    // Fallback to treating it as comma-separated string
    if (typeof movie.genre === 'string') {
      parsedGenre = movie.genre.split(',').map(g => g.trim());
    }
  }

  return (
    <Link to={`/movies/${movie.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 group-hover:scale-105 w-full">
        <div className="relative">
          <img
            src={movie.imageurl || "/placeholder.png"} // fallback image
            alt={movie.title}
            className="w-full h-72 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-medium">{movie.rating}/10</span>
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{movie.title}</h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-600 text-sm">
              <Clock className="h-4 w-4 mr-2" />
              <span>{movie.duration}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{movie.releasedate || "Coming Soon"}</span>
            </div>
          </div>

          {parsedGenre.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {parsedGenre.map((genre: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
            Book Tickets
          </button>
        </div>
      </div>
    </Link>
  );
}
