import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  FaUserCheck,
  FaBed,
  FaAward,
  FaCalendarCheck,
  FaConciergeBell,
  FaArrowRight,
  FaShieldAlt,
  FaInfoCircle
} from 'react-icons/fa';

const GuestDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        const res = await apiClient.get('/api/v1/bookings/my');
        if (res.data?.bookings) {
          setBookings(res.data.bookings);
        }
      } catch (err) {
        console.error('Error loading guest bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
  }, []);

  const activeBookings = bookings.filter((b) =>
    ['confirmed', 'pending', 'checked_in'].includes(b.bookingStatus)
  );

  return (
    <div className="container py-4">
      {/* Welcome Banner */}
      <div className="glass-panel p-4 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="hero-glow"></div>
        <div className="row align-items-center">
          <div className="col-lg-8">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge-role-guest">Guest Portal</span>
              <span className="text-secondary small">Member ID: {user?.id?.slice(-6) || 'HP-001'}</span>
            </div>
            <h2 className="font-serif-luxury text-white mb-2">
              Welcome back, {user?.name || 'Valued Guest'}
            </h2>
            <p className="text-secondary mb-3">
              Manage your upcoming hospitality stays, browse luxury suites, and view exclusive member benefits.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Link to="/#suites-collection" className="btn btn-gold btn-sm">
                Browse Suites <FaArrowRight size={12} />
              </Link>
              <Link to="/my-bookings" className="btn btn-outline-gold btn-sm">
                View My Bookings ({bookings.length})
              </Link>
            </div>
          </div>

          <div className="col-lg-4 mt-4 mt-lg-0 text-lg-end">
            <div
              className="d-inline-flex flex-column p-3 rounded text-start"
              style={{ background: 'rgba(7, 11, 25, 0.7)', border: '1px solid rgba(212, 175, 55, 0.25)' }}
            >
              <div className="small text-secondary mb-1">Authenticated Account</div>
              <div className="text-white fw-bold mb-1">{user?.email}</div>
              <div className="small text-white-50">{user?.phone}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="stat-card">
            <div
              className="stat-icon-wrapper"
              style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--hotel-gold)' }}
            >
              <FaAward />
            </div>
            <div>
              <div className="text-secondary small">Loyalty Tier</div>
              <div className="fs-4 fw-bold text-white">Gold Elite (500 pts)</div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stat-card">
            <div
              className="stat-icon-wrapper"
              style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2DD4BF' }}
            >
              <FaCalendarCheck />
            </div>
            <div>
              <div className="text-secondary small">Active Stays</div>
              <div className="fs-4 fw-bold text-white">
                {loading ? '...' : `${activeBookings.length} Active`}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stat-card">
            <div
              className="stat-icon-wrapper"
              style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA' }}
            >
              <FaConciergeBell />
            </div>
            <div>
              <div className="text-secondary small">Concierge Access</div>
              <div className="fs-4 fw-bold text-white">24/7 Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings Section */}
      <div className="glass-panel p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <FaBed style={{ color: 'var(--hotel-gold)' }} size={20} />
            <h4 className="font-serif-luxury text-white mb-0">Upcoming Bookings & Stays</h4>
          </div>
          <Link to="/my-bookings" className="btn btn-outline-gold btn-sm">
            View All
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading your stays..." size="sm" />
        ) : bookings.length === 0 ? (
          <div
            className="p-4 rounded text-center my-2"
            style={{ background: 'rgba(7, 11, 25, 0.5)', border: '1px dashed rgba(212, 175, 55, 0.25)' }}
          >
            <FaInfoCircle className="text-warning mb-2" size={28} />
            <h5 className="text-white mb-1">No Active Reservations Found</h5>
            <p className="text-secondary small mx-auto mb-3" style={{ maxWidth: '500px' }}>
              Experience world-class luxury accommodations with our live booking engine.
            </p>
            <Link to="/#suites-collection" className="btn btn-outline-gold btn-sm">
              Explore Available Suites
            </Link>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {bookings.slice(0, 3).map((b) => (
              <div
                key={b._id}
                className="p-3 rounded d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2"
                style={{ background: 'rgba(7, 11, 25, 0.5)', border: '1px solid rgba(212, 175, 55, 0.15)' }}
              >
                <div>
                  <div className="text-white fw-bold">
                    {b.room?.roomNumber || 'Suite'} — {b.room?.roomType || 'Deluxe'}
                  </div>
                  <div className="text-secondary small">
                    {new Date(b.checkInDate).toLocaleDateString()} to{' '}
                    {new Date(b.checkOutDate).toLocaleDateString()} ({b.totalNights} nights)
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <span className="fs-5 fw-bold" style={{ color: 'var(--hotel-gold)' }}>
                    ${b.totalAmount}
                  </span>
                  <StatusBadge type="booking" status={b.bookingStatus} />
                  <Link to="/my-bookings" className="btn btn-outline-gold btn-sm py-1 px-2">
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile & Security Details */}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <FaUserCheck className="text-success" />
              <h5 className="font-serif-luxury text-white mb-0">Guest Profile Details</h5>
            </div>
            <ul className="list-unstyled d-flex flex-column gap-2 text-secondary small mb-0">
              <li className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10">
                <span>Full Name:</span>
                <span className="text-white fw-semibold">{user?.name}</span>
              </li>
              <li className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10">
                <span>Registered Email:</span>
                <span className="text-white fw-semibold">{user?.email}</span>
              </li>
              <li className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10">
                <span>Contact Phone:</span>
                <span className="text-white fw-semibold">{user?.phone}</span>
              </li>
              <li className="d-flex justify-content-between py-1">
                <span>Account Status:</span>
                <span className="badge bg-success bg-opacity-25 text-success">Active</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <FaShieldAlt className="text-warning" />
              <h5 className="font-serif-luxury text-white mb-0">Security & Privileges</h5>
            </div>
            <p className="text-secondary small mb-3">
              Your account is authenticated via signed JWT bearer tokens and password hashing through bcryptjs.
            </p>
            <div className="p-3 rounded" style={{ background: 'rgba(7, 11, 25, 0.6)' }}>
              <div className="d-flex justify-content-between small text-white-50">
                <span>Assigned Role:</span>
                <span className="badge-role-guest">{user?.role}</span>
              </div>
              <div className="d-flex justify-content-between small text-white-50 mt-2">
                <span>Authorized Endpoints:</span>
                <span className="text-white">/api/v1/bookings/my, /api/v1/auth/me</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
