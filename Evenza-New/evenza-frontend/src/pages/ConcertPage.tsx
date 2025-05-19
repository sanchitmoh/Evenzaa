import { useEffect, useState } from 'react';
import ConcertCard from '../components/ConcertCard';
import axios from 'axios';
import { Concert } from '../types';

export default function ConcertsPage() {
    const [concertEvents, setConcertEvents] = useState<Concert[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [locations, setLocations] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        axios.get('http://localhost:8080/api/concerts')
            .then(response => {
                // Ensure we have an array of concerts
                const concerts = Array.isArray(response.data) ? response.data : [];
                
                // Map the response to match our Concert type
                const mappedConcerts = concerts.map((concert: any) => ({
                    ...concert,
                    imageUrl: concert.imageurl, // Map backend imageurl to frontend imageUrl
                    category: concert.category || 'CONCERT' // Ensure category is set
                }));
                
                setConcertEvents(mappedConcerts);

                const uniqueLocations = Array.from(new Set(mappedConcerts.map(event => event.location)));
                const uniqueCategories = Array.from(new Set(mappedConcerts.map(event => event.category)));

                setLocations(uniqueLocations.filter(Boolean));
                setCategories(uniqueCategories.filter(Boolean));
                setError(null);
            })
            .catch(error => {
                console.error('Error fetching concert events:', error);
                setError('Failed to load concerts. Please try again later.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const filteredConcertEvents = concertEvents.filter((event) => {
        const matchesPrice = event.price >= priceRange[0] && event.price <= priceRange[1];
        const matchesLocation = selectedLocation === 'all' || event.location === selectedLocation;
        const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
        const matchesDate = !selectedDate || event.date === selectedDate;
        return matchesPrice && matchesLocation && matchesCategory && matchesDate;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading concerts...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center text-red-600">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">Upcoming Concerts</h1>
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
                                    <option value="all">All Locations</option>
                                    {locations.map(location => (
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
                                    <option value="all">All Categories</option>
                                    {categories.map(category => (
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
                    {/* Concert Cards Section */}
                    <div className="flex-1">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Concerts ({filteredConcertEvents.length})
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredConcertEvents.map((event) => (
                                <ConcertCard key={event.id} concert={event} />
                            ))}
                        </div>
                        {filteredConcertEvents.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No concerts found matching your filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
