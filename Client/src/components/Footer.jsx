import React, { useState, useEffect } from 'react';
import { FaCrown, FaHeart, FaCircle } from 'react-icons/fa';
import apiClient from '../api/axios';

const Footer = () => {
  const [apiOnline, setApiOnline] = useState(null);

  useEffect(() => {
    // Check backend health asynchronously
    apiClient
      .get('/api/health')
      .then((res) => {
        if (res.data && res.data.success) {
          setApiOnline(true);
        } else {
          setApiOnline(false);
        }
      })
      .catch(() => setApiOnline(false));
  }, []);

  return (
    <footer className="hotel-footer">
      <div className="container">
        <div className="row g-4 pb-4">
          <div className="col-lg-5 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#070B19'
                }}
              >
                <FaCrown size={16} />
              </div>
              <span className="font-serif-luxury text-white fs-5 fw-bold">
                Hotel<span style={{ color: 'var(--hotel-gold)' }}>Pro</span>
              </span>
            </div>
            <p className="text-secondary small pe-lg-4 mb-3">
              Next-generation luxury hospitality management architecture. Built with enterprise security,
              granular role governance, and flawless guest experience.
            </p>
            <div className="d-flex align-items-center gap-2 small">
              <span className="text-secondary">Backend API Health:</span>
              {apiOnline === null ? (
                <span className="text-muted">Checking...</span>
              ) : apiOnline ? (
                <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 d-flex align-items-center gap-1">
                  <FaCircle size={8} /> Online (Port 8001)
                </span>
              ) : (
                <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 d-flex align-items-center gap-1">
                  <FaCircle size={8} /> Offline
                </span>
              )}
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3 font-serif-luxury" style={{ color: 'var(--hotel-gold)' }}>
              Hospitality Modules
            </h6>
            <ul className="list-unstyled small text-secondary d-flex flex-column gap-2 mb-0">
              <li className="text-white-50">✓ Module 1: Foundation & Auth</li>
              <li className="text-muted">○ Module 2: Booking Engine & Rooms</li>
              <li className="text-muted">○ Module 3: Advanced Portals & Reports</li>
            </ul>
          </div>

          <div className="col-lg-4 col-md-12">
            <h6 className="text-white fw-bold mb-3 font-serif-luxury" style={{ color: 'var(--hotel-gold)' }}>
              Security & Compliance
            </h6>
            <p className="small text-secondary mb-2">
              All credentials protected via bcryptjs salted cryptography and JWT bearer authorization.
              PCI-DSS architecture compliant for future payment integration.
            </p>
            <div className="small text-muted">
              Database: <code className="text-warning">HotelPro (MongoDB 127.0.0.1:27017)</code>
            </div>
          </div>
        </div>

        <div className="border-top border-secondary border-opacity-10 pt-3 text-center small text-secondary">
          © {new Date().getFullYear()} HotelPro Management System. Crafted with precision for enterprise hospitality.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
