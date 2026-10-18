import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  FaConciergeBell,
  FaDoorOpen,
  FaBroom,
  FaCheckCircle,
  FaSyncAlt,
  FaSignInAlt,
  FaSignOutAlt,
  FaBed,
  FaSearch,
  FaFilter,
  FaUserClock
} from 'react-icons/fa';

const StaffDashboard = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Filters & Search
  const [guestSearch, setGuestSearch] = useState('');
  const [rosterFilter, setRosterFilter] = useState('all'); // 'all', 'arrivals', 'in_house', 'departures'
  const [housekeepingFilter, setHousekeepingFilter] = useState('all'); // 'all', 'clean', 'dirty', 'cleaning_in_progress', 'inspected'

  // Confirm Modal state for Check-in / Check-out
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    type: null, // 'checkin' or 'checkout'
    bookingId: null,
    guestName: '',
    roomNumber: ''
  });

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, roomsRes] = await Promise.allSettled([
        apiClient.get('/api/v1/admin/bookings?limit=100'),
        apiClient.get('/api/v1/rooms?limit=100')
      ]);

      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.data.bookings || []);
      if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value.data.rooms || []);
    } catch (err) {
      console.error('Error fetching staff operational data:', err);
      toastError('Failed to load operational roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, []);

  // Open Check-In Confirm Modal
  const openCheckInModal = (booking) => {
    setConfirmModalState({
      isOpen: true,
      type: 'checkin',
      bookingId: booking._id,
      guestName: booking.user?.name || 'Guest',
      roomNumber: booking.room?.roomNumber || 'Assigned Suite'
    });
  };

  // Open Check-Out Confirm Modal
  const openCheckOutModal = (booking) => {
    setConfirmModalState({
      isOpen: true,
      type: 'checkout',
      bookingId: booking._id,
      guestName: booking.user?.name || 'Guest',
      roomNumber: booking.room?.roomNumber || 'Assigned Suite'
    });
  };

  // Execute Confirmed Operational Action
  const handleConfirmAction = async () => {
    const { type, bookingId, guestName, roomNumber } = confirmModalState;
    if (!bookingId || !type) return;

    setActionLoading(bookingId);
    try {
      if (type === 'checkin') {
        await apiClient.patch(`/api/v1/staff/bookings/${bookingId}/checkin`);
        success(`Guest ${guestName} checked in to ${roomNumber}!`);
      } else if (type === 'checkout') {
        await apiClient.patch(`/api/v1/staff/bookings/${bookingId}/checkout`);
        success(`Guest ${guestName} checked out of ${roomNumber}. Room marked dirty.`);
      }

      setConfirmModalState({
        isOpen: false,
        type: null,
        bookingId: null,
        guestName: '',
        roomNumber: ''
      });
      await loadStaffData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed.';
      toastError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // Housekeeping Status Update Action
  const handleHousekeepingChange = async (roomId, newStatus) => {
    setActionLoading(roomId);
    try {
      await apiClient.patch(`/api/v1/staff/rooms/${roomId}/housekeeping`, {
        housekeepingStatus: newStatus
      });
      success(`Suite housekeeping updated to '${newStatus.replace(/_/g, ' ')}'.`);
      await loadStaffData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update housekeeping.';
      toastError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // Calculated operational counts
  const arrivalsExpected = bookings.filter((b) => b.bookingStatus === 'confirmed');
  const departuresExpected = bookings.filter((b) => b.bookingStatus === 'checked_in');
  const cleanRooms = rooms.filter((r) => r.housekeepingStatus === 'clean');
  const dirtyRooms = rooms.filter((r) => r.housekeepingStatus === 'dirty');
  const inProgressRooms = rooms.filter((r) => r.housekeepingStatus === 'cleaning_in_progress');

  // Filter Roster
  const filteredBookings = bookings.filter((b) => {
    if (rosterFilter === 'arrivals') {
      if (b.bookingStatus !== 'confirmed') return false;
    } else if (rosterFilter === 'in_house') {
      if (b.bookingStatus !== 'checked_in') return false;
    } else if (rosterFilter === 'departures') {
      if (!['checked_in', 'checked_out'].includes(b.bookingStatus)) return false;
    }

    if (guestSearch.trim()) {
      const q = guestSearch.toLowerCase().trim();
      const matchGuest = (b.user?.name || '').toLowerCase().includes(q);
      const matchRoom = (b.room?.roomNumber || '').toLowerCase().includes(q);
      const matchRef = b._id.toLowerCase().includes(q);
      return matchGuest || matchRoom || matchRef;
    }
    return true;
  });

  // Filter Housekeeping Rooms
  const filteredRooms = rooms.filter((r) => {
    if (housekeepingFilter !== 'all' && r.housekeepingStatus !== housekeepingFilter) {
      return false;
    }
    return true;
  });

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
            <h2 className="font-serif-luxury text-white mb-2">Hospitality Operations Console</h2>
            <p className="text-secondary mb-0">
              Welcome, {user?.name}. Process guest arrivals, execute check-outs, and monitor room turnover dispatch.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={loadStaffData}
              disabled={loading}
              className="btn btn-outline-gold btn-sm d-flex align-items-center gap-1"
            >
              <FaSyncAlt className={loading ? 'fa-spin' : ''} />
              <span>Refresh Roster</span>
            </button>
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
              <div className="text-secondary small">Expected Arrivals</div>
              <div className="fs-4 fw-bold text-white">{arrivalsExpected.length} Guests</div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA' }}>
              <FaConciergeBell />
            </div>
            <div>
              <div className="text-secondary small">In-House Guests</div>
              <div className="fs-4 fw-bold text-white">{departuresExpected.length} Active</div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
              <FaBroom />
            </div>
            <div>
              <div className="text-secondary small">Dirty / Turnover</div>
              <div className="fs-4 fw-bold text-white">{dirtyRooms.length} Pending</div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}>
              <FaCheckCircle />
            </div>
            <div>
              <div className="text-secondary small">Clean & Ready</div>
              <div className="fs-4 fw-bold text-white">{cleanRooms.length} Rooms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Arrivals & Departures Roster */}
      <div className="glass-panel p-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <FaUserClock style={{ color: 'var(--hotel-gold)' }} />
            <h4 className="font-serif-luxury text-white mb-0">Front Desk Guest Roster</h4>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search guest or room..."
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-25"
              style={{ maxWidth: '200px' }}
            />
            <select
              value={rosterFilter}
              onChange={(e) => setRosterFilter(e.target.value)}
              className="form-select form-select-sm bg-dark text-white border-secondary border-opacity-25"
              style={{ width: 'auto' }}
            >
              <option value="all">All Bookings</option>
              <option value="arrivals">Expected Arrivals (Confirmed)</option>
              <option value="in_house">In-House Guests (Checked In)</option>
              <option value="departures">Recent Departures</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading front desk roster..." size="sm" />
        ) : filteredBookings.length === 0 ? (
          <p className="text-secondary small mb-0 py-3 text-center">No reservations match the selected roster filter.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ background: 'transparent' }}>
              <thead>
                <tr className="border-secondary border-opacity-25 text-secondary small">
                  <th>ROOM #</th>
                  <th>GUEST NAME</th>
                  <th>STAY DATES</th>
                  <th>STATUS</th>
                  <th>PAYMENT</th>
                  <th className="text-end">OPERATIONAL ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const canCheckIn = ['confirmed', 'pending'].includes(b.bookingStatus);
                  const canCheckOut = b.bookingStatus === 'checked_in';

                  return (
                    <tr key={b._id}>
                      <td className="text-warning fw-bold">{b.room?.roomNumber || 'Room'}</td>
                      <td className="text-white">
                        <div className="fw-semibold">{b.user?.name || 'Guest'}</div>
                        <div className="text-secondary" style={{ fontSize: '0.72rem' }}>
                          {b.user?.phone || b.user?.email}
                        </div>
                      </td>
                      <td className="text-secondary small">
                        {new Date(b.checkInDate).toLocaleDateString()} — {new Date(b.checkOutDate).toLocaleDateString()}
                      </td>
                      <td>
                        <StatusBadge type="booking" status={b.bookingStatus} />
                      </td>
                      <td>
                        <StatusBadge type="payment" status={b.paymentStatus} />
                      </td>
                      <td className="text-end">
                        {canCheckIn && (
                          <button
                            onClick={() => openCheckInModal(b)}
                            disabled={actionLoading === b._id}
                            className="btn btn-outline-success btn-sm py-1 px-2 d-inline-flex align-items-center gap-1 me-1"
                          >
                            <FaSignInAlt size={12} /> Check-In
                          </button>
                        )}
                        {canCheckOut && (
                          <button
                            onClick={() => openCheckOutModal(b)}
                            disabled={actionLoading === b._id}
                            className="btn btn-gold btn-sm py-1 px-2 d-inline-flex align-items-center gap-1"
                          >
                            <FaSignOutAlt size={12} /> Check-Out
                          </button>
                        )}
                        {!canCheckIn && !canCheckOut && (
                          <span className="text-white-50 small">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Housekeeping Roster Section */}
      <div className="glass-panel p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <FaBroom style={{ color: 'var(--hotel-gold)' }} />
            <h4 className="font-serif-luxury text-white mb-0">Housekeeping & Room Hygiene Status</h4>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small">Filter:</span>
            <select
              value={housekeepingFilter}
              onChange={(e) => setHousekeepingFilter(e.target.value)}
              className="form-select form-select-sm bg-dark text-white border-secondary border-opacity-25"
              style={{ width: 'auto' }}
            >
              <option value="all">All Rooms ({rooms.length})</option>
              <option value="dirty">Dirty Only ({dirtyRooms.length})</option>
              <option value="cleaning_in_progress">Cleaning In Progress ({inProgressRooms.length})</option>
              <option value="clean">Clean Only ({cleanRooms.length})</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-dark table-hover mb-0" style={{ background: 'transparent' }}>
            <thead>
              <tr className="border-secondary border-opacity-25 text-secondary small">
                <th>ROOM #</th>
                <th>CLASS</th>
                <th>INVENTORY</th>
                <th>CURRENT HOUSEKEEPING</th>
                <th className="text-end">UPDATE STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room) => (
                <tr key={room._id}>
                  <td className="text-warning fw-bold">{room.roomNumber}</td>
                  <td className="text-white">{room.roomType}</td>
                  <td className="text-white-50 small">{room.inventory} Units</td>
                  <td>
                    <StatusBadge type="housekeeping" status={room.housekeepingStatus} />
                  </td>
                  <td className="text-end">
                    <select
                      value={room.housekeepingStatus}
                      onChange={(e) => handleHousekeepingChange(room._id, e.target.value)}
                      disabled={actionLoading === room._id}
                      className="form-select form-select-sm bg-dark text-white border-secondary border-opacity-50 d-inline-block w-auto"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <option value="clean">Clean</option>
                      <option value="dirty">Dirty</option>
                      <option value="cleaning_in_progress">Cleaning in Progress</option>
                      <option value="inspected">Inspected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Check-in / Check-out */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={
          confirmModalState.type === 'checkin'
            ? `Check In ${confirmModalState.guestName}?`
            : `Check Out ${confirmModalState.guestName}?`
        }
        message={
          confirmModalState.type === 'checkin'
            ? `Confirm check-in for ${confirmModalState.guestName} to ${confirmModalState.roomNumber}? This marks the booking active in-house.`
            : `Confirm check-out for ${confirmModalState.guestName} from ${confirmModalState.roomNumber}? The room will automatically be flagged as dirty for housekeeping turnover.`
        }
        confirmText={confirmModalState.type === 'checkin' ? 'Check In Guest' : 'Complete Check-Out'}
        confirmVariant={confirmModalState.type === 'checkin' ? 'gold' : 'primary'}
        isLoading={Boolean(actionLoading)}
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModalState({
            isOpen: false,
            type: null,
            bookingId: null,
            guestName: '',
            roomNumber: ''
          })
        }
      />
    </div>
  );
};

export default StaffDashboard;
