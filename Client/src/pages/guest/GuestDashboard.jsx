import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
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
              <Link to="/#rooms-preview" className="btn btn-gold btn-sm">
                Browse Suites <FaArrowRight size={12} />
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
            <div className="stat-icon-wrapper" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--hotel-gold)' }}>
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
            <div className="stat-icon-wrapper" style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2DD4BF' }}>
              <FaCalendarCheck />
            </div>
            <div>
              <div className="text-secondary small">Active Bookings</div>
              <div className="fs-4 fw-bold text-white">0 Upcoming</div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA' }}>
              <FaConciergeBell />
            </div>
            <div>
              <div className="text-secondary small">Concierge Access</div>
              <div className="fs-4 fw-bold text-white">24/7 Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Module 2 Roadmap Preview Card */}
      <div className="glass-panel p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <FaBed style={{ color: 'var(--hotel-gold)' }} size={20} />
          <h4 className="font-serif-luxury text-white mb-0">Upcoming Bookings & Stays</h4>
        </div>

        <div
          className="p-4 rounded text-center my-2"
          style={{ background: 'rgba(7, 11, 25, 0.5)', border: '1px dashed rgba(212, 175, 55, 0.25)' }}
        >
          <FaInfoCircle className="text-warning mb-2" size={28} />
          <h5 className="text-white mb-1">No Active Reservations Found</h5>
          <p className="text-secondary small mx-auto mb-3" style={{ maxWidth: '500px' }}>
            Full suite selection, date-overlap verification, and dynamic reservation workflows are part of
            <strong> Module 2 (Booking Engine & Room Inventory)</strong>.
          </p>
          <Link to="/#rooms-preview" className="btn btn-outline-gold btn-sm">
            Preview Suites in Module 1
          </Link>
        </div>
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
                <span className="text-white">GET /api/v1/auth/me</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
