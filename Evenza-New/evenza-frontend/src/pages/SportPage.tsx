import { useEffect, useState } from 'react';
import SportCard from '../components/SportCard';
import axios from 'axios';

export default function SportsPage() {
    const [sportsEvents, setSportsEvents] = useState([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [locations, setLocations] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        axios.get('http://localhost:8080/api/sports') // ✅ FIXED: Removed "?type=sports"
            .then(response => {
                setSportsEvents(response.data);

                const uniqueLocations = Array.from(new Set(response.data.map((event: any) => event.location)));
                const uniqueCategories = Array.from(new Set(response.data.map((event: any) => event.category)));

                setLocations(uniqueLocations);
                setCategories(uniqueCategories);
            })
            .catch(error => {
                console.error('Error fetching sports events:', error);
            });
    }, []);

    const filteredSportsEvents = sportsEvents.filter((event: any) => {
        const matchesPrice = event.price >= priceRange[0] && event.price <= priceRange[1];
        const matchesLocation = selectedLocation === 'all' || event.location === selectedLocation;
        const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
        const matchesDate = !selectedDate || event.date === selectedDate;
        return matchesPrice && matchesLocation && matchesCategory && matchesDate;
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">Upcoming Sports Events</h1>
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
                    {/* Sports Cards Section */}
                    <div className="flex-1">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Sports Events ({filteredSportsEvents.length})
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSportsEvents.map((event: any) => (
                                <SportCard key={event.id} event={event} />
                            ))}
                        </div>
                        {filteredSportsEvents.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No sports events found matching your filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
