import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FaTimes,
  FaCalendarAlt,
  FaCreditCard,
  FaCheckCircle,
  FaExclamationCircle,
  FaBed,
  FaShieldAlt,
  FaClock,
  FaInfoCircle
} from 'react-icons/fa';

const BookingModal = ({ room, initialDates, onClose, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // Date formatting helpers
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayAfterTomorrowStr = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(initialDates?.checkIn || tomorrowStr);
  const [checkOut, setCheckOut] = useState(initialDates?.checkOut || dayAfterTomorrowStr);
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentOption, setPaymentOption] = useState('pay_now'); // 'pay_now' or 'pay_later'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Compute stay metrics
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  const totalAmount = (room?.rentPerNight || 0) * (nights > 0 ? nights : 1);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate submission
    setError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (new Date(checkIn) < new Date(todayStr)) {
      setError('Check-in date cannot be in the past.');
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out date must be at least one day after check-in.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Booking (Authoritative server pricing & inventory check)
      const bookingPayload = {
        roomId: room._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        specialRequests: specialRequests.trim()
      };

      const bookingRes = await apiClient.post('/api/v1/bookings', bookingPayload);
      const createdBooking = bookingRes.data.booking;

      // 2. Handle Instant Payment if selected
      if (paymentOption === 'pay_now') {
        const orderRes = await apiClient.post('/api/v1/payments/create-order', {
          bookingId: createdBooking._id
        });

        const order = orderRes.data.order;

        // If mock provider is used or development mode without real Razorpay keys
        if (order.provider === 'mock' || !order.key_id) {
          // Verify simulated development payment
          await apiClient.post('/api/v1/payments/verify', {
            bookingId: createdBooking._id,
            providerPaymentId: order.mockPaymentId || `sim_pay_${Date.now()}`,
            providerOrderId: order.orderId
          });
        }
      }

      setBookingSuccess({
        ...createdBooking,
        paymentOption
      });

      success(`Reservation confirmed for ${room?.roomNumber}!`);

      if (onSuccess) {
        onSuccess(createdBooking);
      }
    } catch (err) {
      console.error('Booking failed:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to complete reservation. Room may no longer be available for selected dates.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: 'rgba(7, 11, 25, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 1050
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass-panel w-100 position-relative p-4 p-md-5 overflow-auto"
        style={{
          maxWidth: '650px',
          maxHeight: '90vh',
          borderRadius: '16px',
          border: '1px solid rgba(212, 175, 55, 0.4)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="btn btn-sm position-absolute top-0 end-0 m-3 text-secondary"
          style={{ background: 'transparent', border: 'none', fontSize: '1.2rem' }}
          aria-label="Close modal"
        >
          <FaTimes />
        </button>

        {bookingSuccess ? (
          <div className="text-center py-4">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: '70px',
                height: '70px',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                fontSize: '2rem'
              }}
            >
              <FaCheckCircle />
            </div>

            <h3 className="font-serif-luxury text-white mb-2">Reservation Confirmed!</h3>
            <p className="text-secondary small mb-4">
              Your suite at HotelPro has been successfully secured on the live booking engine.
            </p>

            <div
              className="p-3 rounded text-start mb-4"
              style={{ background: 'rgba(7, 11, 25, 0.6)', border: '1px solid rgba(212, 175, 55, 0.2)' }}
            >
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 small">
                <span className="text-secondary">Booking Reference:</span>
                <span className="text-warning fw-bold">{bookingSuccess._id}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 small">
                <span className="text-secondary">Suite:</span>
                <span className="text-white fw-bold">
                  {room?.roomNumber} ({room?.roomType})
                </span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 small">
                <span className="text-secondary">Schedule:</span>
                <span className="text-white-50">
                  {checkIn} to {checkOut} ({nights} night{nights > 1 ? 's' : ''})
                </span>
              </div>
              <div className="d-flex justify-content-between py-1 small">
                <span className="text-secondary">Payment Mode:</span>
                <span className="badge bg-success bg-opacity-25 text-success">
                  {bookingSuccess.paymentOption === 'pay_now'
                    ? 'Verified & Paid (Dev Simulated)'
                    : 'Pay At Front Desk'}
                </span>
              </div>
            </div>

            <div className="d-flex justify-content-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  navigate('/my-bookings');
                }}
                className="btn btn-gold px-4"
              >
                View in My Bookings
              </button>
              <button onClick={onClose} className="btn btn-outline-light px-4">
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <FaBed style={{ color: 'var(--hotel-gold)' }} />
              <span
                className="text-uppercase small fw-bold"
                style={{ color: 'var(--hotel-gold)', letterSpacing: '0.08em' }}
              >
                Suite Reservation
              </span>
            </div>
            <h3 className="font-serif-luxury text-white mb-1">
              {room?.roomNumber} — {room?.roomType}
            </h3>
            <p className="text-secondary small mb-4">
              Rate: <span className="text-white fw-bold">${room?.rentPerNight}</span> / night
            </p>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 small py-2 mb-3">
                <FaExclamationCircle className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBooking}>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label text-secondary small mb-1">Check-in Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    required
                    disabled={loading}
                    className="form-control bg-dark text-white border-secondary border-opacity-50"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-secondary small mb-1">Check-out Date</label>
                  <input
                    type="date"
                    min={checkIn || todayStr}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                    disabled={loading}
                    className="form-control bg-dark text-white border-secondary border-opacity-50"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small mb-1">Special Requests (Optional)</label>
                <textarea
                  rows="2"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  disabled={loading}
                  placeholder="High floor, quiet corner, early arrival, etc."
                  className="form-control bg-dark text-white border-secondary border-opacity-50 small"
                ></textarea>
              </div>

              {/* Price Breakdown */}
              <div
                className="p-3 rounded mb-3"
                style={{ background: 'rgba(7, 11, 25, 0.6)', border: '1px solid rgba(212, 175, 55, 0.2)' }}
              >
                <div className="d-flex justify-content-between py-1 text-secondary small">
                  <span>
                    ${room?.rentPerNight} × {nights} Night{nights > 1 ? 's' : ''}
                  </span>
                  <span className="text-white">${totalAmount}</span>
                </div>
                <div className="d-flex justify-content-between py-1 text-secondary small">
                  <span>Taxes & Service Fees</span>
                  <span className="text-success">Complimentary</span>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top border-secondary border-opacity-25 mt-1">
                  <span className="text-white fw-bold">Total Stay Amount</span>
                  <span className="fs-5 fw-bold" style={{ color: 'var(--hotel-gold)' }}>
                    ${totalAmount}
                  </span>
                </div>
              </div>

              {/* Payment Option Selection */}
              <div className="mb-4">
                <label className="form-label text-secondary small mb-2">Payment Preference</label>
                <div className="d-flex flex-column gap-2">
                  <label
                    className={`p-3 rounded border d-flex align-items-center gap-3 cursor-pointer ${
                      paymentOption === 'pay_now'
                        ? 'border-warning bg-warning bg-opacity-10 text-white'
                        : 'border-secondary border-opacity-25 text-secondary'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'pay_now'}
                      onChange={() => setPaymentOption('pay_now')}
                      disabled={loading}
                      className="form-check-input"
                    />
                    <div className="d-flex align-items-center gap-2">
                      <FaCreditCard className="text-warning" />
                      <div>
                        <div className="small fw-semibold text-white">
                          Instant Payment (Online Mock / Gateway)
                        </div>
                        <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                          <span className="text-warning">Development Simulation:</span> Verified securely on
                          backend HMAC order flow. No real card charged.
                        </div>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded border d-flex align-items-center gap-3 cursor-pointer ${
                      paymentOption === 'pay_later'
                        ? 'border-warning bg-warning bg-opacity-10 text-white'
                        : 'border-secondary border-opacity-25 text-secondary'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'pay_later'}
                      onChange={() => setPaymentOption('pay_later')}
                      disabled={loading}
                      className="form-check-input"
                    />
                    <div className="d-flex align-items-center gap-2">
                      <FaClock className="text-info" />
                      <div>
                        <div className="small fw-semibold text-white">Reserve & Pay at Front Desk</div>
                        <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                          Guaranteed reservation held pending arrival settlement
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="btn btn-outline-secondary px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || nights < 1}
                  className="btn btn-gold px-4 d-flex align-items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Reserving...</span>
                    </>
                  ) : (
                    <span>Confirm Reservation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
