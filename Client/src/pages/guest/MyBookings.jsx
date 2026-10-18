import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  FaCalendarCheck,
  FaBed,
  FaTimesCircle,
  FaCreditCard,
  FaArrowLeft,
  FaSyncAlt,
  FaExclamationTriangle,
  FaSearch,
  FaFilter
} from 'react-icons/fa';

const MyBookings = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Filter & Search states
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'active', 'completed', 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation modal state for cancellation
  const [cancelModalState, setCancelModalState] = useState({
    isOpen: false,
    bookingId: null,
    roomNumber: ''
  });

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/api/v1/bookings/my');
      if (res.data?.bookings) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      const msg = err.response?.data?.message || 'Failed to retrieve your reservations.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const openCancelModal = (booking) => {
    setCancelModalState({
      isOpen: true,
      bookingId: booking._id,
      roomNumber: booking.room?.roomNumber || 'your reserved suite'
    });
  };

  const handleConfirmCancel = async () => {
    const { bookingId } = cancelModalState;
    if (!bookingId) return;

    setActionLoading(bookingId);
    try {
      await apiClient.patch(`/api/v1/bookings/${bookingId}/cancel`, {
        reason: 'Guest self-service cancellation via portal'
      });
      success('Reservation cancelled. Available inventory has been updated.');
      setCancelModalState({ isOpen: false, bookingId: null, roomNumber: '' });
      await fetchBookings();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to cancel reservation.';
      toastError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayNow = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      const orderRes = await apiClient.post('/api/v1/payments/create-order', {
        bookingId
      });
      const order = orderRes.data.order;

      // Complete simulation / mock payment
      await apiClient.post('/api/v1/payments/verify', {
        bookingId,
        providerPaymentId: order.mockPaymentId || `sim_pay_${Date.now()}`,
        providerOrderId: order.orderId
      });

      success('Payment verified successfully (Development Simulation)!');
      await fetchBookings();
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment simulation failed.';
      toastError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    // 1. Tab filter
    if (filterTab === 'active') {
      if (!['confirmed', 'pending', 'checked_in'].includes(b.bookingStatus)) return false;
    } else if (filterTab === 'completed') {
      if (!['checked_out', 'completed'].includes(b.bookingStatus)) return false;
    } else if (filterTab === 'cancelled') {
      if (b.bookingStatus !== 'cancelled') return false;
    }

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRef = b._id.toLowerCase().includes(q);
      const matchRoom = (b.room?.roomNumber || '').toLowerCase().includes(q);
      const matchType = (b.room?.roomType || '').toLowerCase().includes(q);
      return matchRef || matchRoom || matchType;
    }

    return true;
  });

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="glass-panel p-4 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="hero-glow"></div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <Link to="/dashboard" className="text-secondary small text-decoration-none d-flex align-items-center gap-1">
                <FaArrowLeft size={10} /> Dashboard
              </Link>
              <span className="text-secondary small">•</span>
              <span className="badge-role-guest">Reservations</span>
            </div>
            <h2 className="font-serif-luxury text-white mb-2">My Hotel Stays</h2>
            <p className="text-secondary mb-0">
              Review current and upcoming suite reservations, process payments, and manage itineraries.
            </p>
          </div>

          <div className="d-flex gap-2">
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="btn btn-outline-gold btn-sm d-flex align-items-center gap-1"
            >
              <FaSyncAlt className={loading ? 'fa-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link to="/#suites-collection" className="btn btn-gold btn-sm">
              Book Another Suite
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div className="d-flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`btn btn-sm ${filterTab === 'all' ? 'btn-gold' : 'btn-outline-secondary text-white-50'}`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`btn btn-sm ${filterTab === 'active' ? 'btn-gold' : 'btn-outline-secondary text-white-50'}`}
          >
            Active Stays ({bookings.filter((b) => ['confirmed', 'pending', 'checked_in'].includes(b.bookingStatus)).length})
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`btn btn-sm ${filterTab === 'completed' ? 'btn-gold' : 'btn-outline-secondary text-white-50'}`}
          >
            Past Stays ({bookings.filter((b) => ['checked_out', 'completed'].includes(b.bookingStatus)).length})
          </button>
          <button
            onClick={() => setFilterTab('cancelled')}
            className={`btn btn-sm ${filterTab === 'cancelled' ? 'btn-gold' : 'btn-outline-secondary text-white-50'}`}
          >
            Cancelled ({bookings.filter((b) => b.bookingStatus === 'cancelled').length})
          </button>
        </div>

        <div className="input-group" style={{ maxWidth: '300px' }}>
          <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
            <FaSearch size={12} />
          </span>
          <input
            type="text"
            placeholder="Search suite or ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-25"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner message="Retrieving your reservations from backend..." />
      ) : bookings.length === 0 ? (
        <div className="glass-panel p-5 text-center">
          <FaCalendarCheck className="text-secondary mb-3" size={48} />
          <h4 className="font-serif-luxury text-white mb-2">No Reservations Found</h4>
          <p className="text-secondary small mx-auto mb-4" style={{ maxWidth: '450px' }}>
            You haven't reserved any suites yet. Explore our luxury accommodations and enjoy an unforgettable stay.
          </p>
          <Link to="/#suites-collection" className="btn btn-gold px-4">
            Browse Luxury Suites
          </Link>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="glass-panel p-5 text-center">
          <FaFilter className="text-secondary mb-3" size={32} />
          <h5 className="text-white mb-1">No Bookings Match Your Filter</h5>
          <p className="text-secondary small">Try selecting another tab or clearing your search query.</p>
          <button
            onClick={() => {
              setFilterTab('all');
              setSearchQuery('');
            }}
            className="btn btn-outline-gold btn-sm mt-2"
          >
            Show All Reservations
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredBookings.map((booking) => {
            const isEligibleForCancel =
              ['pending', 'confirmed'].includes(booking.bookingStatus) &&
              new Date(booking.checkInDate) > new Date();

            const isPendingPayment = booking.paymentStatus === 'pending';

            return (
              <div
                key={booking._id}
                className="glass-panel p-4"
                style={{ border: '1px solid rgba(212, 175, 55, 0.25)' }}
              >
                <div className="row g-3 align-items-center">
                  <div className="col-lg-3">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <FaBed style={{ color: 'var(--hotel-gold)' }} />
                      <h5 className="font-serif-luxury text-white mb-0">
                        {booking.room?.roomNumber || 'Suite'}
                      </h5>
                    </div>
                    <div className="text-secondary small">
                      {booking.room?.roomType || 'Deluxe'} • {booking.totalNights} Night
                      {booking.totalNights > 1 ? 's' : ''}
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                      Ref: <code className="text-warning">{booking._id}</code>
                    </div>
                  </div>

                  <div className="col-lg-3">
                    <div className="text-secondary small">Stay Schedule</div>
                    <div className="text-white fw-semibold">
                      {new Date(booking.checkInDate).toLocaleDateString()} —{' '}
                      {new Date(booking.checkOutDate).toLocaleDateString()}
                    </div>
                    <div className="text-secondary small">
                      Rate: ${booking.priceSnapshotPerNight} / night
                    </div>
                  </div>

                  <div className="col-lg-2">
                    <div className="text-secondary small">Total Stay</div>
                    <div className="fs-5 fw-bold" style={{ color: 'var(--hotel-gold)' }}>
                      ${booking.totalAmount}
                    </div>
                    <div className="mt-1">
                      <StatusBadge type="payment" status={booking.paymentStatus} />
                    </div>
                  </div>

                  <div className="col-lg-2">
                    <div className="text-secondary small">Reservation Status</div>
                    <div className="mt-1">
                      <StatusBadge type="booking" status={booking.bookingStatus} />
                    </div>
                    {booking.cancellationReason && (
                      <div className="text-danger small mt-1" style={{ fontSize: '0.72rem' }}>
                        Reason: {booking.cancellationReason}
                      </div>
                    )}
                  </div>

                  <div className="col-lg-2 text-lg-end">
                    <div className="d-flex flex-column gap-2">
                      {isPendingPayment && booking.bookingStatus !== 'cancelled' && (
                        <button
                          onClick={() => handlePayNow(booking._id)}
                          disabled={actionLoading === booking._id}
                          className="btn btn-gold btn-sm d-flex align-items-center justify-content-center gap-1"
                        >
                          <FaCreditCard size={12} />
                          <span>Pay Online</span>
                        </button>
                      )}

                      {isEligibleForCancel && (
                        <button
                          onClick={() => openCancelModal(booking)}
                          disabled={actionLoading === booking._id}
                          className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center gap-1"
                        >
                          <FaTimesCircle size={12} />
                          <span>Cancel Stay</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {booking.specialRequests && (
                  <div className="mt-3 pt-2 border-top border-secondary border-opacity-10 text-secondary small">
                    <strong className="text-white-50">Special Requests:</strong> {booking.specialRequests}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelModalState.isOpen}
        title="Cancel Reservation?"
        message={`Are you sure you wish to cancel your reservation for ${cancelModalState.roomNumber}? Your held dates will immediately be released to other guests.`}
        confirmText="Yes, Cancel Stay"
        confirmVariant="danger"
        isLoading={Boolean(actionLoading)}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelModalState({ isOpen: false, bookingId: null, roomNumber: '' })}
      />
    </div>
  );
};

export default MyBookings;
