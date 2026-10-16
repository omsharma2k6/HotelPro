import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaShieldAlt, FaArrowLeft, FaSpinner } from 'react-icons/fa';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container py-5 text-center my-auto">
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <FaSpinner className="text-warning fa-spin mb-3" size={40} />
          <h5 className="text-white">Verifying Secure Session...</h5>
          <p className="text-secondary small">Authenticating credentials with HotelPro security gateway</p>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="container py-5 my-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="glass-panel p-4 text-center">
              <div
                className="mx-auto mb-3 text-warning"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaShieldAlt size={32} />
              </div>
              <h3 className="font-serif-luxury text-white mb-2">Access Restricted</h3>
              <p className="text-secondary mb-4">
                Your account role is{' '}
                <span className={`badge-role-${user.role} text-uppercase`}>{user.role}</span>.
                This area requires permissions restricted to:{' '}
                <strong className="text-warning">{allowedRoles.join(', ')}</strong>.
              </p>

              <div className="d-flex justify-content-center gap-3">
                <Link to="/" className="btn btn-outline-gold btn-sm">
                  <FaArrowLeft className="me-1" /> Return Home
                </Link>
                <Link
                  to={
                    user.role === 'admin'
                      ? '/admin/dashboard'
                      : user.role === 'staff'
                      ? '/staff/dashboard'
                      : '/dashboard'
                  }
                  className="btn btn-gold btn-sm"
                >
                  Go to My Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
