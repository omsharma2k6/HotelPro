import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/axios';
import BookingModal from '../components/BookingModal';
import {
  FaCrown,
  FaBed,
  FaKey,
  FaShieldAlt,
  FaConciergeBell,
  FaArrowRight,
  FaCalendarAlt,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaUtensils,
  FaSpa,
  FaSwimmingPool,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaFilter,
  FaUndo
} from 'react-icons/fa';

const FALLBACK_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';

const POPULAR_AMENITIES = [
  'High-speed WiFi',
  'King Bed',
  'Ocean View',
  'City Skyline View',
  'Rain Shower',
  'Private Jacuzzi',
  'Butler Service',
  'Espresso Machine'
];

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();

  // Search Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayAfterTomorrowStr = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(tomorrowStr);
  const [checkOut, setCheckOut] = useState(dayAfterTomorrowStr);
  const [selectedType, setSelectedType] = useState('All');
  const [maxPrice, setMaxPrice] = useState(600);
  const [selectedAmenity, setSelectedAmenity] = useState('');

  // Rooms and Availability State
  const [rooms, setRooms] = useState([]);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Modal State
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/rooms?limit=20');
      if (res.data?.rooms) {
        setRooms(res.data.rooms);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (e) => {
    if (e) e.preventDefault();
    if (!checkIn || !checkOut) return;

    if (new Date(checkOut) <= new Date(checkIn)) {
      alert('Check-out date must be after check-in date.');
      return;
    }

    setSearching(true);
    try {
      const res = await apiClient.get(
        `/api/v1/rooms/availability?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`
      );
      if (res.data?.rooms) {
        const map = {};
        res.data.rooms.forEach((r) => {
          map[r._id] = {
            isAvailable: r.isAvailable,
            availableUnits: r.availableUnits,
            inventory: r.inventory
          };
        });
        setAvailabilityMap(map);
      }
    } catch (err) {
      console.error('Failed to check availability:', err);
    } finally {
      setSearching(false);
    }
  };

  // Initial check availability once rooms are loaded
  useEffect(() => {
    if (rooms.length > 0) {
      checkAvailability();
    }
  }, [rooms.length]);

  const handleReserveClick = (room) => {
    if (!isAuthenticated) {
      info('Please sign in or register to complete your reservation.');
      navigate('/login', { state: { from: { pathname: '/' } } });
      return;
    }
    setSelectedRoomForBooking(room);
  };

  const handleResetFilters = () => {
    setSelectedType('All');
    setMaxPrice(600);
    setSelectedAmenity('');
  };

  // Filter rooms based on user criteria
  const filteredRooms = rooms.filter((r) => {
    if (selectedType !== 'All' && r.roomType !== selectedType) return false;
    if (r.rentPerNight > maxPrice) return false;
    if (selectedAmenity && !r.amenities?.some((a) => a.toLowerCase().includes(selectedAmenity.toLowerCase()))) {
      return false;
    }
    return true;
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-gradient text-center">
        <div className="hero-glow"></div>
        <div className="container position-relative py-5">
          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-4"
            style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}
          >
            <FaCrown style={{ color: 'var(--hotel-gold)' }} />
            <span className="small text-white fw-semibold" style={{ letterSpacing: '0.08em' }}>
              HOTELPRO LUXURY HOSPITALITY
            </span>
          </div>

          <h1 className="font-serif-luxury display-4 text-white fw-bold mb-3 mx-auto" style={{ maxWidth: '850px' }}>
            Where Unrivaled Luxury Meets Seamless Management
          </h1>

          <p className="text-secondary fs-5 mx-auto mb-4" style={{ maxWidth: '680px' }}>
            Experience world-class accommodations engineered with precision. Enjoy real-time date availability,
            instant reservation workflows, and authoritative security governance.
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
            <a href="#suites-collection" className="btn btn-outline-light px-4 py-2" style={{ borderRadius: '8px' }}>
              Explore Available Suites
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
                <h5 className="font-serif-luxury text-white mb-2">Date-Based Inventory</h5>
                <p className="text-secondary small mb-0">
                  Real-time date overlap calculations and concurrency-safe reservation serialization per room.
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
                <h5 className="font-serif-luxury text-white mb-2">Role Governance</h5>
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
                <h5 className="font-serif-luxury text-white mb-2">Secure Payments</h5>
                <p className="text-secondary small mb-0">
                  Backend order verification, HMAC-SHA256 signatures, idempotent callbacks, and mock provider support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms & Dynamic Booking Engine Section */}
      <section id="suites-collection" className="py-5">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
            <div>
              <h6 className="text-uppercase fw-bold" style={{ color: 'var(--hotel-gold)', letterSpacing: '0.1em' }}>
                Suites Collection
              </h6>
              <h2 className="font-serif-luxury text-white mb-0">Discover & Reserve Luxury Accommodations</h2>
            </div>
            <div className="mt-3 mt-md-0 d-flex align-items-center gap-2">
              <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-3 py-2">
                Live Dynamic Inventory
              </span>
            </div>
          </div>

          {/* Interactive Date & Filter Controls */}
          <div className="glass-panel p-4 mb-5" style={{ border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <form onSubmit={checkAvailability} className="row g-3 align-items-end">
              <div className="col-lg-3 col-md-6">
                <label className="form-label text-secondary small mb-1 d-flex align-items-center gap-1">
                  <FaCalendarAlt className="text-warning" /> Check-in Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="form-control bg-dark text-white border-secondary border-opacity-50"
                  required
                />
              </div>

              <div className="col-lg-3 col-md-6">
                <label className="form-label text-secondary small mb-1 d-flex align-items-center gap-1">
                  <FaCalendarAlt className="text-warning" /> Check-out Date
                </label>
                <input
                  type="date"
                  min={checkIn || todayStr}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="form-control bg-dark text-white border-secondary border-opacity-50"
                  required
                />
              </div>

              <div className="col-lg-2 col-md-4">
                <label className="form-label text-secondary small mb-1">Room Class</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="form-select bg-dark text-white border-secondary border-opacity-50"
                >
                  <option value="All">All Suites</option>
                  <option value="Suite">Suite</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Double">Double</option>
                  <option value="Single">Single</option>
                </select>
              </div>

              <div className="col-lg-2 col-md-4">
                <label className="form-label text-secondary small mb-1">
                  Max Rate: <span className="text-warning fw-bold">${maxPrice}</span>
                </label>
                <input
                  type="range"
                  min="80"
                  max="600"
                  step="20"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="form-range"
                />
              </div>

              <div className="col-lg-2 col-md-4">
                <button
                  type="submit"
                  disabled={searching}
                  className="btn btn-gold w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  {searching ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <FaSearch />
                      <span>Check Dates</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Amenity Filter Chips */}
            <div className="mt-3 pt-3 border-top border-secondary border-opacity-15 d-flex flex-wrap align-items-center gap-2">
              <span className="text-secondary small d-flex align-items-center gap-1">
                <FaFilter size={10} /> Filter by Amenity:
              </span>
              {POPULAR_AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => setSelectedAmenity(selectedAmenity === amenity ? '' : amenity)}
                  className={`btn btn-sm py-0 px-2 rounded-pill ${
                    selectedAmenity === amenity
                      ? 'btn-gold'
                      : 'btn-outline-secondary border-opacity-25 text-white-50'
                  }`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {amenity}
                </button>
              ))}
              {(selectedType !== 'All' || maxPrice < 600 || selectedAmenity) && (
                <button
                  onClick={handleResetFilters}
                  className="btn btn-link btn-sm text-warning text-decoration-none py-0 px-2 small d-inline-flex align-items-center gap-1"
                >
                  <FaUndo size={10} /> Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Rooms Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
              <p className="text-secondary mt-2">Loading hotel inventory...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="glass-panel p-5 text-center">
              <FaBed className="text-secondary mb-3" size={40} />
              <h4 className="text-white">No suites match your criteria</h4>
              <p className="text-secondary small mx-auto mb-3" style={{ maxWidth: '500px' }}>
                {rooms.length === 0
                  ? 'No room records found in the database. You can seed luxury suites safely by running "node utils/seedRooms.js" on the server.'
                  : 'Try adjusting your room class, price range, or amenity filters.'}
              </p>
              {rooms.length > 0 && (
                <button onClick={handleResetFilters} className="btn btn-outline-gold btn-sm">
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="row g-4">
              {filteredRooms.map((room) => {
                const availInfo = availabilityMap[room._id];
                const isAvailable = availInfo ? availInfo.isAvailable : room.status === 'available';
                const availableCount = availInfo ? availInfo.availableUnits : room.inventory;

                return (
                  <div key={room._id} className="col-lg-4 col-md-6">
                    <div className="glass-panel h-100 overflow-hidden d-flex flex-column">
                      <div className="position-relative" style={{ height: '230px', overflow: 'hidden' }}>
                        <img
                          src={room.photos?.[0] || FALLBACK_ROOM_IMAGE}
                          alt={room.roomNumber}
                          onError={(e) => {
                            e.target.src = FALLBACK_ROOM_IMAGE;
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          className="position-absolute top-0 end-0 m-3 px-3 py-1 rounded-pill small fw-bold"
                          style={{
                            background: 'rgba(7, 11, 25, 0.85)',
                            color: 'var(--hotel-gold)',
                            border: '1px solid var(--hotel-gold)'
                          }}
                        >
                          {room.roomNumber}
                        </div>

                        {/* Availability Pill */}
                        <div className="position-absolute bottom-0 start-0 m-3">
                          {isAvailable ? (
                            <span className="badge bg-success bg-opacity-85 text-white d-flex align-items-center gap-1 shadow">
                              <FaCheckCircle size={10} /> {availableCount} Available
                            </span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-85 text-white d-flex align-items-center gap-1 shadow">
                              <FaTimesCircle size={10} /> Fully Booked
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 d-flex flex-column flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="badge bg-primary bg-opacity-25 text-info border border-info border-opacity-25">
                            {room.roomType}
                          </span>
                          <div className="text-white">
                            <span className="fs-4 fw-bold" style={{ color: 'var(--hotel-gold)' }}>
                              ${room.rentPerNight}
                            </span>
                            <span className="text-secondary small"> / night</span>
                          </div>
                        </div>

                        <h4 className="font-serif-luxury text-white mb-2">{room.roomType} Suite</h4>
                        <p className="text-secondary small mb-3">{room.description}</p>

                        <div className="d-flex flex-wrap gap-2 mb-4 mt-auto">
                          {room.amenities?.slice(0, 4).map((item, idx) => (
                            <span
                              key={idx}
                              className="small text-white-50 bg-dark bg-opacity-50 px-2 py-1 rounded border border-secondary border-opacity-25"
                            >
                              ✓ {item}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => handleReserveClick(room)}
                          disabled={!isAvailable}
                          className={`btn w-100 btn-sm ${
                            isAvailable ? 'btn-gold' : 'btn-outline-secondary disabled'
                          }`}
                        >
                          {isAvailable ? 'Reserve Suite' : 'Unavailable for Selected Dates'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Hotel Services & Luxury Experiences */}
      <section className="py-5" style={{ background: 'var(--hotel-bg-surface)' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <h6 className="text-uppercase fw-bold" style={{ color: 'var(--hotel-gold)', letterSpacing: '0.1em' }}>
              Curated Amenities
            </h6>
            <h2 className="font-serif-luxury text-white">World-Class Hospitality Services</h2>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="glass-panel p-4 h-100 text-center">
                <div
                  className="mx-auto mb-3"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '14px',
                    background: 'rgba(212, 175, 55, 0.15)',
                    color: 'var(--hotel-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem'
                  }}
                >
                  <FaUtensils />
                </div>
                <h5 className="font-serif-luxury text-white mb-2">Gastronomic Dining</h5>
                <p className="text-secondary small mb-0">
                  Award-winning fine dining restaurants featuring seasonal artisan menus and an extensive private cellar.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="glass-panel p-4 h-100 text-center">
                <div
                  className="mx-auto mb-3"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '14px',
                    background: 'rgba(20, 184, 166, 0.15)',
                    color: '#2DD4BF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem'
                  }}
                >
                  <FaSpa />
                </div>
                <h5 className="font-serif-luxury text-white mb-2">Holistic Spa Retreat</h5>
                <p className="text-secondary small mb-0">
                  Rejuvenating therapeutic massages, aromatherapy steam suites, and customized wellness treatments.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="glass-panel p-4 h-100 text-center">
                <div
                  className="mx-auto mb-3"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '14px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60A5FA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem'
                  }}
                >
                  <FaSwimmingPool />
                </div>
                <h5 className="font-serif-luxury text-white mb-2">Skyline Infinity Pool</h5>
                <p className="text-secondary small mb-0">
                  Heated rooftop infinity pool offering panoramic skyline views, private cabanas, and signature refreshments.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="glass-panel p-4 h-100 text-center">
                <div
                  className="mx-auto mb-3"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '14px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#A78BFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem'
                  }}
                >
                  <FaConciergeBell />
                </div>
                <h5 className="font-serif-luxury text-white mb-2">24/7 Butler Service</h5>
                <p className="text-secondary small mb-0">
                  Dedicated personal concierge and butler assistance tailored to your personal travel itinerary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About & Location Section */}
      <section className="py-5" id="about-section">
        <div className="container py-4">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <div className="glass-panel p-4 p-md-5">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <FaCrown style={{ color: 'var(--hotel-gold)' }} />
                  <span className="small text-warning fw-bold text-uppercase">The HotelPro Legacy</span>
                </div>
                <h2 className="font-serif-luxury text-white mb-3">Distinguished Hospitality & Engineering</h2>
                <p className="text-secondary mb-3">
                  Founded on a commitment to uncompromising excellence, HotelPro pairs classical high-luxury
                  accommodations with modern, resilient full-stack technology. Every stay is managed with real-time
                  inventory precision, cryptographic user privacy, and intuitive digital control.
                </p>
                <div className="d-flex gap-4 pt-2 border-top border-secondary border-opacity-15">
                  <div>
                    <div className="fs-3 fw-bold" style={{ color: 'var(--hotel-gold)' }}>
                      99.9%
                    </div>
                    <div className="text-secondary small">Inventory Accuracy</div>
                  </div>
                  <div>
                    <div className="fs-3 fw-bold text-white">24/7</div>
                    <div className="text-secondary small">Front Desk Assistance</div>
                  </div>
                  <div>
                    <div className="fs-3 fw-bold text-info">Zero</div>
                    <div className="text-secondary small">Raw Card Storage (PCI)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="glass-panel p-4 p-md-5 h-100">
                <h4 className="font-serif-luxury text-white mb-3">Concierge & Location Inquiries</h4>
                <p className="text-secondary small mb-4">
                  Have questions about private suites, executive events, or arrival transfers? Our guest experience
                  desk is available around the clock.
                </p>

                <ul className="list-unstyled d-flex flex-column gap-3 text-secondary small mb-0">
                  <li className="d-flex align-items-center gap-3">
                    <span className="text-warning">
                      <FaMapMarkerAlt size={16} />
                    </span>
                    <span className="text-white">742 Evergreen Boulevard, Luxury Quarter, Metropole</span>
                  </li>
                  <li className="d-flex align-items-center gap-3">
                    <span className="text-warning">
                      <FaPhoneAlt size={16} />
                    </span>
                    <span className="text-white">+1 (800) 555-HOTELPRO / Direct Desk: +1 (555) 019-8234</span>
                  </li>
                  <li className="d-flex align-items-center gap-3">
                    <span className="text-warning">
                      <FaEnvelope size={16} />
                    </span>
                    <span className="text-white">concierge@hotelpro.internal</span>
                  </li>
                </ul>
              </div>
            </div>
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
              {isAuthenticated ? (
                <Link to="/my-bookings" className="btn btn-gold px-4 py-2">
                  View My Bookings
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-gold px-4 py-2">
                    Create Guest Account
                  </Link>
                  <Link to="/login" className="btn btn-outline-gold px-4 py-2">
                    Member Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Booking Modal */}
      {selectedRoomForBooking && (
        <BookingModal
          room={selectedRoomForBooking}
          initialDates={{ checkIn, checkOut }}
          onClose={() => setSelectedRoomForBooking(null)}
          onSuccess={() => {
            checkAvailability();
          }}
        />
      )}
    </div>
  );
};

export default Home;
