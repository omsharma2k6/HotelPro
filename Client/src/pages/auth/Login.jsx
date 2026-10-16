import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaCrown, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSignInAlt, FaInfoCircle } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login(email, password);

      // Route according to user role or original intended location
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'staff') {
        navigate('/staff/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to log in. Please check your credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@hotelpro.local');
    setPassword('AdminPassword2026!');
    setError('');
  };

  return (
    <div className="container py-5 my-auto">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-5">
          <div className="glass-panel p-4 p-md-5">
            {/* Header */}
            <div className="text-center mb-4">
              <div
                className="mx-auto mb-3"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#070B19',
                  boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)'
                }}
              >
                <FaCrown size={24} />
              </div>
              <h2 className="font-serif-luxury text-white mb-1">Welcome Back</h2>
              <p className="text-secondary small">Sign in to your HotelPro portal</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4" role="alert">
                <FaInfoCircle className="flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-white-50 small fw-semibold">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    className="form-control hotel-input"
                    placeholder="guest@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label text-white-50 small fw-semibold mb-0">Password</label>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
                    <FaLock />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control hotel-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-opacity-25 text-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-gold w-100 py-2 mb-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <FaSignInAlt className="me-1" /> Sign In
                  </>
                )}
              </button>
            </form>

            {/* Demo Autofill Hint */}
            <div
              className="p-3 rounded mb-3"
              style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px dashed rgba(212, 175, 55, 0.3)' }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-white-50">Need quick testing credentials?</span>
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="btn btn-link btn-sm p-0 text-warning text-decoration-none fw-semibold"
                >
                  Fill Seeded Admin
                </button>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="text-center text-secondary small">
              Don't have an account?{' '}
              <Link to="/register" className="text-warning text-decoration-none fw-semibold">
                Register as Guest
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
