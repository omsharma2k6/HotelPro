import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaCrown,
  FaBed,
  FaKey,
  FaShieldAlt,
  FaConciergeBell,
  FaWifi,
  FaTv,
  FaCheckCircle,
  FaArrowRight
} from 'react-icons/fa';

const sampleRooms = [
  {
    id: 1,
    title: 'Executive Royal Suite',
    type: 'Suite',
    price: 320,
    tag: 'Signature Suite',
    amenities: ['King Bed', 'Panoramic Ocean View', 'Private Jacuzzi', 'High-speed WiFi'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    description: 'Our premier suite featuring bespoke Italian furnishings, expansive balcony, and dedicated butler service.'
  },
  {
    id: 2,
    title: 'Deluxe Horizon Room',
    type: 'Deluxe',
    price: 210,
    tag: 'Popular Choice',
    amenities: ['Queen Bed', 'City Skyline View', 'Rain Shower', 'Espresso Machine'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    description: 'Immaculately crafted living space providing sublime tranquility and panoramic skyline vistas.'
  },
  {
    id: 3,
    title: 'Classic Double Elegance',
    type: 'Double',
    price: 150,
    tag: 'Family Favorite',
    amenities: ['Two Double Beds', 'Soundproof Windows', 'Ergonomic Workstation'],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    description: 'Spacious accommodation offering seamless comfort for couples and traveling families.'
  }
];

const Home = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-gradient text-center">
        <div className="hero-glow"></div>
        <div className="container position-relative py-4">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-4"
               style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <FaCrown style={{ color: 'var(--hotel-gold)' }} />
            <span className="small text-white fw-semibold" style={{ letterSpacing: '0.05em' }}>
              HOTELPRO ENTERPRISE HOSPITALITY
            </span>
          </div>

          <h1 className="font-serif-luxury display-4 text-white fw-bold mb-3 mx-auto" style={{ maxWidth: '850px' }}>
            Where Unrivaled Luxury Meets Seamless Management
          </h1>

          <p className="text-secondary fs-5 mx-auto mb-4" style={{ maxWidth: '680px' }}>
            Experience world-class accommodations with precision engineering. HotelPro delivers high-fidelity
            reservation workflows, granular role governance, and state-of-the-art security.
          </p>

          <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
            {isAuthenticated ? (
              <Link
                to={
                  user.role === 'admin'
                    ? '/admin/dashboard'
                    : user.role === 'staff'
                    ? '/staff/dashboard'
                    : '/dashboard'
                }
                className="btn btn-gold px-4 py-2"
              >
                Enter {user.role === 'admin' ? 'Admin Console' : user.role === 'staff' ? 'Staff Desk' : 'Guest Portal'}
                <FaArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-gold px-4 py-2">
                  Begin Your Journey <FaArrowRight size={14} />
                </Link>
                <Link to="/login" className="btn btn-outline-gold px-4 py-2">
                  Guest Sign In
                </Link>
              </>
            )}
            <a href="#rooms-preview" className="btn btn-outline-light px-4 py-2" style={{ borderRadius: '8px' }}>
              Explore Suites
            </a>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-5" style={{ background: 'var(--hotel-bg-surface)' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <h6 className="text-uppercase fw-bold" style={{ color: 'var(--hotel-gold)', letterSpacing: '0.1em' }}>
              Hospitality Foundation
            </h6>
            <h2 className="font-serif-luxury text-white">Engineered for Excellence</h2>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="glass-panel p-4 h-100 text-center">
                <div
                  className="mx-auto mb-3"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'rgba(212, 175, 55, 0.15)',
                    color: 'var(--hotel-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}
                >
                  <FaKey />
                </div>
                <h5 className="font-serif-luxury text-white mb-2">Secure Authentication</h5>
                <p className="text-secondary small mb-0">
                  Full cryptographic bcrypt hashing and stateless JWT bearer security with auto-expirations.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="glass-panel p-4 h-100 text-center">
                <div
                  className="mx-auto mb-3"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'rgba(20, 184, 166, 0.15)',
                    color: '#2DD4BF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}
                >
                  <FaBed />
                </div>
                <h5 className="font-serif-luxury text-white mb-2">Flexible Room Inventory</h5>
                <p className="text-secondary small mb-0">
                  Dual-mode room capacity schemas with snapshot rate freezing and high-performance MongoDB indexing.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="glass-panel p-4 h-100 text-center">
                <div
                  className="mx-auto mb-3"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#A78BFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}
                >
                  <FaShieldAlt />
                </div>
                <h5 className="font-serif-luxury text-white mb-2">Role-Based Governance</h5>
                <p className="text-secondary small mb-0">
                  Authoritative multi-tier authorization for Guests, Hospitality Staff, and System Administrators.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="glass-panel p-4 h-100 text-center">
                <div
                  className="mx-auto mb-3"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'rgba(244, 63, 94, 0.15)',
                    color: '#FB7185',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}
                >
                  <FaConciergeBell />
                </div>
                <h5 className="font-serif-luxury text-white mb-2">PCI-DSS Ready</h5>
                <p className="text-secondary small mb-0">
                  Zero plaintext card data stored. Designed for seamless Module 2 & 3 payment orchestration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms Preview Section */}
      <section id="rooms-preview" className="py-5">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
            <div>
              <h6 className="text-uppercase fw-bold" style={{ color: 'var(--hotel-gold)', letterSpacing: '0.1em' }}>
                Featured Suites
              </h6>
              <h2 className="font-serif-luxury text-white mb-0">Designed For Ultimate Comfort</h2>
            </div>
            <div className="mt-3 mt-md-0">
              <span className="badge bg-secondary bg-opacity-25 border border-secondary text-white-50 px-3 py-2">
                Module 2 Booking Engine Preview
              </span>
            </div>
          </div>

          <div className="row g-4">
            {sampleRooms.map((room) => (
              <div key={room.id} className="col-lg-4 col-md-6">
                <div className="glass-panel h-100 overflow-hidden d-flex flex-column">
                  <div className="position-relative" style={{ height: '220px', overflow: 'hidden' }}>
                    <img
                      src={room.image}
                      alt={room.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      className="position-absolute top-0 end-0 m-3 px-3 py-1 rounded-pill small fw-bold"
                      style={{ background: 'rgba(7, 11, 25, 0.85)', color: 'var(--hotel-gold)', border: '1px solid var(--hotel-gold)' }}
                    >
                      {room.tag}
                    </div>
                  </div>

                  <div className="p-4 d-flex flex-column flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-primary bg-opacity-25 text-info border border-info border-opacity-25">
                        {room.type}
                      </span>
                      <div className="text-white">
                        <span className="fs-4 fw-bold" style={{ color: 'var(--hotel-gold)' }}>
                          ${room.price}
                        </span>
                        <span className="text-secondary small"> / night</span>
                      </div>
                    </div>

                    <h4 className="font-serif-luxury text-white mb-2">{room.title}</h4>
                    <p className="text-secondary small mb-3">{room.description}</p>

                    <div className="d-flex flex-wrap gap-2 mb-4 mt-auto">
                      {room.amenities.map((item, idx) => (
                        <span key={idx} className="small text-white-50 bg-dark bg-opacity-50 px-2 py-1 rounded border border-secondary border-opacity-25">
                          ✓ {item}
                        </span>
                      ))}
                    </div>

                    <Link to="/register" className="btn btn-outline-gold w-100 btn-sm">
                      Reserve in Module 2
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-5" style={{ background: 'var(--hotel-bg-surface)' }}>
        <div className="container py-4">
          <div className="glass-panel p-5 text-center position-relative overflow-hidden">
            <div className="hero-glow"></div>
            <h2 className="font-serif-luxury text-white mb-3">Begin Your HotelPro Experience</h2>
            <p className="text-secondary mx-auto mb-4" style={{ maxWidth: '600px' }}>
              Create an account today to access exclusive guest reservations or log in with verified staff credentials.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Link to="/register" className="btn btn-gold px-4 py-2">
                Create Guest Account
              </Link>
              <Link to="/login" className="btn btn-outline-gold px-4 py-2">
                Member Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
