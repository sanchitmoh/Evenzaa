import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from "../components/admin/AdminDashboard";
import EventManagement from './admin/EventManagement.jsx';
import EventForm from './admin/EventForm';
import UserManagement from './admin/UserManagement';
import TransactionManagement from './admin/TransactionManagement';

export default function AdminPage() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/events" element={<EventManagement />} />
        <Route path="/events/new" element={<EventForm />} />
        <Route path="/events/:id/edit" element={<EventForm />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/transactions" element={<TransactionManagement />} />
      </Routes>
    </AdminLayout>
  );
}
