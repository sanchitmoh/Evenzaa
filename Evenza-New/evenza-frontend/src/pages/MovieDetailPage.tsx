import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {Movie} from "../types";
import {Link} from "react-router-dom";

const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await axios.get<Movie>(`http://localhost:8080/api/movies/${id}`);
        setMovie(response.data);
      } catch (err) {
        console.error("Error fetching movie:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMovie();
  }, [id]);

  const handleBookNow = () => {
    navigate(`/checkout/${movie?.id}`);
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!movie) return <div className="text-center mt-10">Movie not found</div>;

  // Safely parse genre and cast
  let parsedGenre: string[] = [];
  let parsedCast: string[] = [];

  try {
    // Handle genre - check if it's a JSON string or a regular comma-separated string
    if (typeof movie.genre === 'string') {
      if (movie.genre.trim().startsWith('[') && movie.genre.trim().endsWith(']')) {
        parsedGenre = JSON.parse(movie.genre);
      } else {
        parsedGenre = movie.genre.split(',').map(g => g.trim());
      }
    } else if (Array.isArray(movie.genre)) {
      parsedGenre = movie.genre;
    }
    
    // Handle cast - check if it's a JSON string or a regular comma-separated string
    if (typeof movie.cast === 'string') {
      if (movie.cast.trim().startsWith('[') && movie.cast.trim().endsWith(']')) {
        parsedCast = JSON.parse(movie.cast);
      } else {
        parsedCast = movie.cast.split(',').map(c => c.trim());
      }
    } else if (Array.isArray(movie.cast)) {
      parsedCast = movie.cast;
    }
  } catch (err) {
    console.warn("Failed to parse genre or cast JSON:", err);
    // Fallback to splitting by comma if JSON parsing fails
    if (typeof movie.genre === 'string') {
      parsedGenre = movie.genre.split(',').map(g => g.trim());
    }
    if (typeof movie.cast === 'string') {
      parsedCast = movie.cast.split(',').map(c => c.trim());
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <img
          src={movie.imageurl}
          alt={movie.title}
          className="w-full md:w-2/3 rounded-xl shadow-lg"
        />
        <div className="md:w-2/3">
          <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
          <p className="text-gray-600 mb-4">{movie.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div><strong>Genre:</strong> {parsedGenre.join(", ")}</div>
            <div><strong>Language:</strong> {movie.language}</div>
            <div><strong>Duration:</strong> {movie.duration}</div>
            <div><strong>Release Date:</strong> {new Date(movie.releasedate).toDateString()}</div>
            <div><strong>Rating:</strong> {movie.rating}/10</div>
            <div><strong>Director:</strong> {movie.director}</div>
            <div><strong>Cast:</strong> {parsedCast.join(", ")}</div>
            <div><strong>Location:</strong> {movie.location}</div>
            <div><strong>Price Range:</strong> {movie.price}</div>
          </div>

          <div className="mt-6">
           <Link
             to="/seat"
              state={{ movie }} // 🔁 passing full event object to stadium page
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                 Book Tickets
                   </Link>
             </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
