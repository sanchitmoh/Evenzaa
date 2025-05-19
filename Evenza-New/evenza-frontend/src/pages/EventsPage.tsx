import { useEffect, useState } from 'react';
import EventCard from '../components/EventCard';
import { Event } from '../types';
import axios from 'axios';

const LOCATIONS = ['All', 'New York', 'San Francisco', 'Chicago', 'Los Angeles', 'Miami', 'Denver', 'Austin', 'Napa Valley', 'Boston', 'Seattle'];
const CATEGORIES = ['All', 'Theater', 'Concert'];

export default function EventPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    axios.get<Event[]>('http://localhost:8080/api/events')
      .then(response => {
        console.log("Fetched events:", response.data); // Debug log
        if (Array.isArray(response.data)) {
          setEvents(response.data);
        } else {
          console.error("API did not return an array:", response.data);
          setEvents([]); // Avoid breaking .filter
        }
      })
      .catch(error => {
        console.error('Error fetching events:', error);
        setEvents([]);
      });
  }, []);

  useEffect(() => {
    const filtered = events.filter(event => {
      const matchesPrice = event.price >= priceRange[0] && event.price <= priceRange[1];
      const matchesLocation = selectedLocation === 'All' || event.location === selectedLocation;
      const matchesCategory = selectedCategory === 'All' || event.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesDate = !selectedDate || event.date === selectedDate;
      return matchesPrice && matchesLocation && matchesCategory && matchesDate;
    });
    setFilteredEvents(filtered);
  }, [events, priceRange, selectedLocation, selectedCategory, selectedDate]);

  return (

    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">Upcoming Events</h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 bg-white p-6 rounded-lg shadow-sm h-fit">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <div className="space-y-6">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="Min"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="Max"
                  />
                </div>
              </div>
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {LOCATIONS.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Event List */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-600">No events match the selected filters.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
