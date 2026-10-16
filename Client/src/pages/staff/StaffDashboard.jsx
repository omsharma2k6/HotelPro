import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FaConciergeBell,
  FaDoorOpen,
  FaBroom,
  FaTools,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';

const StaffDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container py-4">
      {/* Welcome Banner */}
      <div className="glass-panel p-4 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="hero-glow"></div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge-role-staff">Staff Desk</span>
              <span className="text-secondary small">Staff ID: {user?.id?.slice(-6) || 'STF-01'}</span>
            </div>
            <h2 className="font-serif-luxury text-white mb-2">
              Hospitality Operations Console
            </h2>
            <p className="text-secondary mb-0">
              Welcome, {user?.name}. Front desk arrivals, departures, and room maintenance status.
            </p>
          </div>
          <div className="text-md-end">
            <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25 px-3 py-2">
              Module 1: Staff Authorization Verified
            </span>
          </div>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2DD4BF' }}>
              <FaDoorOpen />
            </div>
            <div>
              <div className="text-secondary small">Today's Check-ins</div>
              <div className="fs-4 fw-bold text-white">4 Expected</div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA' }}>
              <FaConciergeBell />
            </div>
            <div>
              <div className="text-secondary small">Today's Check-outs</div>
              <div className="fs-4 fw-bold text-white">2 Expected</div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--hotel-gold)' }}>
              <FaBroom />
            </div>
            <div>
              <div className="text-secondary small">Housekeeping</div>
              <div className="fs-4 fw-bold text-white">3 Pending</div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#FB7185' }}>
              <FaTools />
            </div>
            <div>
              <div className="text-secondary small">Maintenance</div>
              <div className="fs-4 fw-bold text-white">1 Room</div>
            </div>
          </div>
        </div>
      </div>

      {/* Front Desk Live Feed Preview */}
      <div className="glass-panel p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="font-serif-luxury text-white mb-0">Today's Guest Roster (Module 2 Preview)</h4>
          <span className="badge bg-secondary bg-opacity-25 text-white-50">Module 2 Dispatcher</span>
        </div>

        <div className="table-responsive">
          <table className="table table-dark table-hover mb-0" style={{ background: 'transparent' }}>
            <thead>
              <tr className="border-secondary border-opacity-25 text-secondary small">
                <th>ROOM #</th>
                <th>GUEST NAME</th>
                <th>TYPE</th>
                <th>SCHEDULE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-warning fw-bold">101</td>
                <td className="text-white">Alexander Vance</td>
                <td className="text-secondary">Deluxe Suite</td>
                <td className="text-white-50 small">Arriving 2:00 PM</td>
                <td>
                  <span className="badge bg-success bg-opacity-25 text-success">Confirmed</span>
                </td>
              </tr>
              <tr>
                <td className="text-warning fw-bold">204</td>
                <td className="text-white">Sophia Chen</td>
                <td className="text-secondary">Executive Penthouse</td>
                <td className="text-white-50 small">Departing 11:00 AM</td>
                <td>
                  <span className="badge bg-warning bg-opacity-25 text-warning">Pending Checkout</span>
                </td>
              </tr>
              <tr>
                <td className="text-warning fw-bold">305</td>
                <td className="text-white">Marcus Brody</td>
                <td className="text-secondary">Classic Double</td>
                <td className="text-white-50 small">In-House</td>
                <td>
                  <span className="badge bg-primary bg-opacity-25 text-info">Checked In</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Housekeeping Dispatch Card */}
      <div className="glass-panel p-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <FaInfoCircle className="text-info" />
          <h5 className="font-serif-luxury text-white mb-0">Operational Architecture Note</h5>
        </div>
        <p className="text-secondary small mb-0">
          This portal is guarded by the backend role middleware <code>isStaff (staff, admin)</code>.
          Room status toggles (Available, Occupied, Maintenance) and live checkout workflows will be connected
          to the Room schema during Module 2.
        </p>
      </div>
    </div>
  );
};

export default StaffDashboard;
