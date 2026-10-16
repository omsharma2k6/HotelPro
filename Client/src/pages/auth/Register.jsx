import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaCrown,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
  FaInfoCircle,
  FaShieldAlt
} from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, phone, password, confirmPassword } = formData;

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      setError('Password must contain at least one letter and one number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirmation password do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        name,
        email,
        phone,
        password,
        confirmPassword
      });

      // Public registration always assigns 'guest', route to guest dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors && err.response.data.errors.join(', ')) ||
        err.message ||
        'Registration failed. Please verify your details.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5 my-auto">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
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
              <h2 className="font-serif-luxury text-white mb-1">Create an Account</h2>
              <p className="text-secondary small">Join HotelPro as an esteemed guest</p>
            </div>

            {/* Role Notice */}
            <div
              className="p-3 rounded mb-4 d-flex align-items-start gap-2"
              style={{ background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.25)' }}
            >
              <FaShieldAlt className="text-info mt-1 flex-shrink-0" />
              <div className="small text-white-50">
                <strong className="text-white">Role Security Notice:</strong> Public registration assigns the{' '}
                <span className="badge-role-guest">guest</span> role. Staff and Administrator accounts are
                provisioned strictly through authorized backend seeding.
              </div>
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
                <label className="form-label text-white-50 small fw-semibold">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    name="name"
                    className="form-control hotel-input"
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label text-white-50 small fw-semibold">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
                      <FaEnvelope />
                    </span>
                    <input
                      type="email"
                      name="email"
                      className="form-control hotel-input"
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-white-50 small fw-semibold">Phone Number</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
                      <FaPhone />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control hotel-input"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-white-50 small fw-semibold">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
                      <FaLock />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-control hotel-input"
                      placeholder="Min 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-white-50 small fw-semibold">Confirm Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
                      <FaLock />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      className="form-control hotel-input"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
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
              </div>

              <button
                type="submit"
                className="btn btn-gold w-100 py-2 mb-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <FaUserPlus className="me-1" /> Create Guest Profile
                  </>
                )}
              </button>
            </form>

            {/* Footer Navigation */}
            <div className="text-center text-secondary small">
              Already have an account?{' '}
              <Link to="/login" className="text-warning text-decoration-none fw-semibold">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
