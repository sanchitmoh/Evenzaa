import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Clock } from 'lucide-react';
import axios from 'axios';
import { SportEvent } from '../types'; // Ensure this reflects your interface

export default function SportDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [sportEvent, setSportEvent] = useState<SportEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await axios.get<SportEvent>(`http://localhost:8080/api/sports/${id}`);
                setSportEvent(response.data);
            } catch (err) {
                setError('Event not found.');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchEvent();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    if (error || !sportEvent) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-center text-red-500">Event Not Found</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="relative h-96">
                        <img
                            src={sportEvent.imageurl}
                            alt={sportEvent.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                            <div className="p-8 text-white">
                                <h1 className="text-4xl font-bold mb-2">{sportEvent.title}</h1>
                                <p className="text-lg">{sportEvent.description}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Event Details</h2>
                                <div className="space-y-4 text-gray-600">
                                    <div className="flex items-center">
                                        <Calendar className="h-5 w-5 mr-2" />
                                        <span>{sportEvent.date}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="h-5 w-5 mr-2" />
                                        <span>{sportEvent.time}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="h-5 w-5 mr-2" />
                                        <span>{sportEvent.venue}, {sportEvent.location}</span>
                                    </div>

                                    <div>
                                        <span className="font-bold">Category: {sportEvent.category}</span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <Link
                                        to="/stadium"
                                        state={{ sportEvent }} // 🔁 passing full event object to stadium page
                                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        Book Tickets
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
