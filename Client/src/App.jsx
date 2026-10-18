import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import GuestDashboard from './pages/guest/GuestDashboard';
import MyBookings from './pages/guest/MyBookings';
import StaffDashboard from './pages/staff/StaffDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <MainLayout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Authenticated Guest Route */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['guest', 'staff', 'admin']}>
                      <GuestDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Authenticated Guest Bookings */}
                <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute allowedRoles={['guest', 'staff', 'admin']}>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />

                {/* Staff Protected Route */}
                <Route
                  path="/staff/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['staff', 'admin']}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Super Admin Protected Route */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MainLayout>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
