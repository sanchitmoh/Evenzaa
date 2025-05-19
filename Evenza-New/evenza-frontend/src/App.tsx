import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthMessage from './components/AuthMessage';
import { useAuth } from './Context/AuthContext';
import { setupAxiosInterceptors } from './utils/authUtils';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const TermsAndConditionsPage = lazy(() => import('./pages/TermsAndConditionsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const RefundPage = lazy(() => import('./pages/RefundPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));

const MoviePage = lazy(() => import('./pages/MoviePage'));
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'));
const ConcertPage = lazy(() => import('./pages/ConcertPage'));
const ConcertDetailPage = lazy(() => import('./pages/ConcertDetailPage'));
const SportPage = lazy(() => import('./pages/SportPage'));
const SportDetailPage = lazy(() => import('./pages/SportDetailPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const SearchResults = lazy(() => import('./pages/SearchResults'));

const SeatSelectionPage = lazy(() => import('./pages/SeatSelectionPage'));
const StadiumSelection = lazy(() => import('./pages/StadiumSelection'));
const ConcertSeat = lazy(() => import('./pages/ConcertSeat'));

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const BookingHistoryPage = lazy(() => import('./pages/BookingHistoryPage'));
const TicketPage = lazy(() => import('./pages/TicketPage'));

const AdminPage = lazy(() => import('./pages/AdminPage'));

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Message wrapper component
const MessageWrapper = () => {
  const { message, clearMessage } = useAuth();
  return <AuthMessage message={message} onClose={clearMessage} />;
};

// AppContent component that uses hooks that require Router context
function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    // Setup interceptors and redirect on unauthorized
    setupAxiosInterceptors(() => {
      navigate('/login');
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <MessageWrapper />
      {/* Scroll to top on route change */}
      <ScrollToTop />
      <main className="flex-grow">
        <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/refund" element={<RefundPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Event/Movie/Concert/Sport Routes */}
            <Route path="/movies" element={<MoviePage />} />
            <Route path="/movies/:id" element={<MovieDetailPage />} />
            <Route path="/concert" element={<ConcertPage />} />
            <Route path="/concert/:id" element={<ConcertDetailPage />} />
            <Route path="/sport" element={<SportPage />} />
            <Route path="/sport/:id" element={<SportDetailPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/search" element={<SearchResults />} />

            {/* Seat Selection Routes */}
            <Route path="/select-seats" element={<SeatSelectionPage />} />
            <Route path="/seat" element={<SeatSelectionPage />} />
            <Route path="/stadium" element={<StadiumSelection />} />
            <Route path="/concertseat" element={<ConcertSeat />} />

            {/* Protected Routes for Regular Users */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking-history"
              element={
                <ProtectedRoute>
                  <BookingHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ticket/:ticketId"
              element={
                <ProtectedRoute>
                  <TicketPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* Forgot Password and Reset Password Routes */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Catch-All Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

// Main App component
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;