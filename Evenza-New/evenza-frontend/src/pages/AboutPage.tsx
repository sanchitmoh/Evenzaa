import { Film } from 'lucide-react';
import  {Link}  from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center mb-6">
            <Film className="w-12 h-12 text-blue-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">About Us</h1>
          
          <div className="space-y-6 text-gray-600">
            <p>
            Welcome to Evenza, your premier destination for discovering and booking tickets to concerts, movies, sports events, and live shows. At Evenza, we are passionate about connecting people with unforgettable experiences.
            </p>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Our Mission</h2>
              <p>
              To revolutionize the event ticket booking experience by providing a user-friendly platform where event enthusiasts can easily discover, book, and enjoy their favorite events.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Why Choose Us?</h2>
              <ul className="list-disc list-inside space-y-2">
              <li>Effortless Booking: A simple and secure ticket booking process.</li>
              <li>Diverse Selection: Explore a wide range of concerts, movies, sports events, and live shows.</li>
              <li>Real-Time Availability: Check seat availability instantly.</li>
              <li>Instant Confirmation: Receive your tickets immediately after booking.</li>
              <li>Exceptional Support: Our customer support team is here to assist you at every step.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Our Story</h2>
              <p>
              Founded in 2023, Evenza has grown into one of the most trusted platforms for event ticket booking. We continuously innovate to bring cutting-edge technologies that enhance your booking experience. Whether you're looking for the latest blockbuster movie or an electrifying concert, Evenza is here to make your moments unforgettable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;