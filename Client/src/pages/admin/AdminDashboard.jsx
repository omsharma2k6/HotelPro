import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/axios';
import {
  FaShieldAlt,
  FaServer,
  FaUsers,
  FaBed,
  FaChartLine,
  FaDatabase,
  FaCheckCircle,
  FaSyncAlt,
  FaLayerGroup
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const res = await apiClient.get('/api/health');
      setHealthData(res.data);
    } catch (err) {
      setHealthData({ success: false, database: 'disconnected', error: err.message });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="container py-4">
      {/* Executive Header Banner */}
      <div className="glass-panel p-4 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="hero-glow"></div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge-role-admin">Executive Console</span>
              <span className="text-secondary small">Super Admin Access</span>
            </div>
            <h2 className="font-serif-luxury text-white mb-2">
              HotelPro Master Administration
            </h2>
            <p className="text-secondary mb-0">
              Welcome, Administrator {user?.name}. System configuration, database telemetry, and enterprise governance.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={fetchHealth}
              disabled={isRefreshing}
              className="btn btn-outline-gold btn-sm d-flex align-items-center gap-1"
            >
              <FaSyncAlt className={isRefreshing ? 'fa-spin' : ''} />
              <span>Refresh Health</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--hotel-gold)' }}>
              <FaChartLine />
            </div>
            <div>
              <div className="text-secondary small">Occupancy Target</div>
              <div className="fs-4 fw-bold text-white">88.5%</div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2DD4BF' }}>
              <FaDatabase />
            </div>
            <div>
              <div className="text-secondary small">MongoDB Cluster</div>
              <div className="fs-4 fw-bold text-white">
                {healthData?.database === 'connected' ? '127.0.0.1 (OK)' : 'Checking...'}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA' }}>
              <FaUsers />
            </div>
            <div>
              <div className="text-secondary small">Access Tier</div>
              <div className="fs-4 fw-bold text-white">Role: {user?.role}</div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' }}>
              <FaServer />
            </div>
            <div>
              <div className="text-secondary small">Backend Port</div>
              <div className="fs-4 fw-bold text-white">:8001</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Telemetry & Live Health */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <FaServer style={{ color: 'var(--hotel-gold)' }} />
                <h5 className="font-serif-luxury text-white mb-0">System Telemetry & Readiness</h5>
              </div>
              <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">
                Live Ping
              </span>
            </div>

            <div className="p-3 rounded mb-3" style={{ background: 'rgba(7, 11, 25, 0.7)' }}>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 small">
                <span className="text-secondary">Health Endpoint:</span>
                <code className="text-warning">GET /api/health</code>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 small">
                <span className="text-secondary">API Response Status:</span>
                <span className="text-white fw-bold">{healthData?.message || 'Loading...'}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 small">
                <span className="text-secondary">Database State:</span>
                <span className={healthData?.database === 'connected' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                  {healthData?.database?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div className="d-flex justify-content-between py-1 small">
                <span className="text-secondary">Last Checked:</span>
                <span className="text-white-50">{healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>

            <p className="text-secondary small mb-0">
              The Express backend enforces startup dependency on MongoDB. Requests are only accepted after
              initial connection succeeds.
            </p>
          </div>
        </div>

        {/* Core Hotel Schema Schematics */}
        <div className="col-lg-6">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <FaLayerGroup style={{ color: 'var(--hotel-gold)' }} />
              <h5 className="font-serif-luxury text-white mb-0">Module Foundation Schemas</h5>
            </div>

            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
              <li className="p-2 rounded d-flex justify-content-between align-items-center" style={{ background: 'rgba(7, 11, 25, 0.5)' }}>
                <div>
                  <strong className="text-white small">User Schema</strong>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Name, Email (Unique), Phone, PasswordHash, Role, IsActive</div>
                </div>
                <span className="badge bg-success bg-opacity-25 text-success">Verified</span>
              </li>

              <li className="p-2 rounded d-flex justify-content-between align-items-center" style={{ background: 'rgba(7, 11, 25, 0.5)' }}>
                <div>
                  <strong className="text-white small">Room Schema</strong>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>RoomNumber, Type (Enum), Rent, Baseline Inventory, Amenities</div>
                </div>
                <span className="badge bg-info bg-opacity-25 text-info">Module 1 Ready</span>
              </li>

              <li className="p-2 rounded d-flex justify-content-between align-items-center" style={{ background: 'rgba(7, 11, 25, 0.5)' }}>
                <div>
                  <strong className="text-white small">Booking Schema</strong>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>User Ref, Room Ref, CheckIn, CheckOut, Price Snapshot, Total</div>
                </div>
                <span className="badge bg-secondary bg-opacity-25 text-white-50">Module 2 Ready</span>
              </li>

              <li className="p-2 rounded d-flex justify-content-between align-items-center" style={{ background: 'rgba(7, 11, 25, 0.5)' }}>
                <div>
                  <strong className="text-white small">Payment Schema</strong>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Booking Ref, Provider, Amount, Currency, PCI-DSS Compliant</div>
                </div>
                <span className="badge bg-secondary bg-opacity-25 text-white-50">Module 2 Ready</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
