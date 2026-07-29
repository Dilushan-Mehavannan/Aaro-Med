import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './index.css';

// Pages
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorSearch from './pages/DoctorSearch';
import DoctorProfile from './pages/DoctorProfile';
import BookingFlow from './pages/BookingFlow';
import QueueTracker from './pages/QueueTracker';
import VideoCallPage from './pages/VideoCallPage';
import PrescriptionPage from './pages/PrescriptionPage';
import FeedbackForm from './pages/FeedbackForm';
import MentalHealthPage from './pages/MentalHealthPage';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorRegister from './pages/DoctorRegister';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

import Navbar from './components/Navbar';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, token, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors" element={<DoctorSearch />} />
        <Route path="/doctors/:doctorId" element={<DoctorProfile />} />
        <Route path="/mental-health" element={<MentalHealthPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/doctor/register" element={<DoctorRegister />} />

        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="patient"><PatientDashboard /></ProtectedRoute>
        } />
        <Route path="/book/:doctorId" element={
          <ProtectedRoute requiredRole="patient"><BookingFlow /></ProtectedRoute>
        } />
        <Route path="/queue/:doctorId" element={
          <ProtectedRoute requiredRole="patient"><QueueTracker /></ProtectedRoute>
        } />
        <Route path="/call/:consultationId" element={
          <ProtectedRoute requiredRole="patient"><VideoCallPage /></ProtectedRoute>
        } />
        <Route path="/prescription/:prescriptionId" element={
          <ProtectedRoute requiredRole="patient"><PrescriptionPage /></ProtectedRoute>
        } />
        <Route path="/feedback/:consultationId" element={
          <ProtectedRoute requiredRole="patient"><FeedbackForm /></ProtectedRoute>
        } />

        <Route path="/doctor/dashboard" element={
          <ProtectedRoute requiredRole={['doctor','psychiatrist']}><DoctorDashboard /></ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
