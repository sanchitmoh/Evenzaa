import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Ticket, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';

function AnimatedLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
     <Link to={to} className="relative px-4 py-2 group overflow-hidden rounded-md">
         <span className="relative z-10 text-gray-700 group-hover:text-white transition-colors duration-300">
           {children}
         </span>
         <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 z-0 rounded-md"></span>
       </Link>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg z-50 relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Ticket className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900"><i>Evenza</i></span>
            </Link>
          </div>

          {/* Hamburger Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-indigo-600 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-4">
            <AnimatedLink to="/">Home</AnimatedLink>
            <AnimatedLink to="/events">Events</AnimatedLink>
            <AnimatedLink to="/concert">Concerts</AnimatedLink>
            <AnimatedLink to="/sport">Sports</AnimatedLink>
            <AnimatedLink to="/movies">Movies</AnimatedLink>

            {isAuthenticated ? (
              <>
                {user?.role === 'ADMIN' ? (
                  <AnimatedLink to="/admin">Admin Dashboard</AnimatedLink>
                ) : (
                  <>
                    <AnimatedLink to="/dashboard">Dashboard</AnimatedLink>
                    <AnimatedLink to="/profile">
                      <div className="flex items-center space-x-1">
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                      </div>
                    </AnimatedLink>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
              >
                <LogIn className="h-5 w-5" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu with Slide Animation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[500px] px-4 pt-2 pb-4' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col space-y-2 bg-white shadow-md rounded-b-md">
          <Link to="/" className="text-gray-700 hover:text-indigo-600 px-4 py-2" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/events" className="text-gray-700 hover:text-indigo-600 px-4 py-2" onClick={() => setIsOpen(false)}>Events</Link>
          <Link to="/concert" className="text-gray-700 hover:text-indigo-600 px-4 py-2" onClick={() => setIsOpen(false)}>Concerts</Link>
          <Link to="/sport" className="text-gray-700 hover:text-indigo-600 px-4 py-2" onClick={() => setIsOpen(false)}>Sports</Link>
          <Link to="/movies" className="text-gray-700 hover:text-indigo-600 px-4 py-2" onClick={() => setIsOpen(false)}>Movies</Link>

          {isAuthenticated ? (
            <>
              {user?.role === 'ADMIN' ? (
                <Link 
                  to="/admin" 
                  className="text-gray-700 hover:text-indigo-600 px-4 py-2" 
                  onClick={() => setIsOpen(false)}
                >
                  Admin Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-gray-700 hover:text-indigo-600 px-4 py-2" 
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/profile" 
                    className="text-gray-700 hover:text-indigo-600 px-4 py-2" 
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center space-x-1">
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </div>
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left text-red-600 hover:text-red-700 px-4 py-2 flex items-center space-x-2"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-center"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center justify-center space-x-2">
                <LogIn className="h-5 w-5" />
                <span>Login</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}