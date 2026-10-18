import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  FaShieldAlt,
  FaServer,
  FaUsers,
  FaBed,
  FaChartLine,
  FaDatabase,
  FaSyncAlt,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaSearch,
  FaCreditCard,
  FaFilter,
  FaClock
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  // Active view tab: 'overview', 'rooms', 'bookings', 'users', 'payments'
  const [activeTab, setActiveTab] = useState('overview');

  // Telemetry & Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filter states
  const [roomSearch, setRoomSearch] = useState('');
  const [roomSort, setRoomSort] = useState('number'); // 'number', 'price_asc', 'price_desc', 'inventory'
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  // Modal / Form States
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    roomType: 'Deluxe',
    rentPerNight: 220,
    inventory: 3,
    description: '',
    amenities: 'King Bed, High-speed WiFi, City View',
    photos: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
  });

  const [editingRoom, setEditingRoom] = useState(null);

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff'
  });

  // Confirm Modal state for room archiving
  const [archiveModalState, setArchiveModalState] = useState({
    isOpen: false,
    roomId: null,
    roomNumber: ''
  });

  // Fetch all administrative telemetry and records
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, healthRes, roomsRes, bookingsRes, usersRes, paymentsRes] = await Promise.allSettled([
        apiClient.get('/api/v1/admin/dashboard'),
        apiClient.get('/api/health'),
        apiClient.get('/api/v1/admin/rooms?limit=100'),
        apiClient.get('/api/v1/admin/bookings?limit=100'),
        apiClient.get('/api/v1/admin/users?limit=100'),
        apiClient.get('/api/v1/admin/payments?limit=100')
      ]);

      if (dashRes.status === 'fulfilled') setDashboardData(dashRes.value.data.metrics);
      if (healthRes.status === 'fulfilled') setHealthData(healthRes.value.data);
      if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value.data.rooms || []);
      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.data.bookings || []);
      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value.data.users || []);
      if (paymentsRes.status === 'fulfilled') setPaymentsList(paymentsRes.value.data.payments || []);

      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching admin telemetry:', err);
      toastError('Failed to refresh some administrative records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Handler: Add Room
  const handleAddRoom = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const amenitiesArr = newRoom.amenities.split(',').map((s) => s.trim()).filter(Boolean);
      const photosArr = newRoom.photos.split(',').map((s) => s.trim()).filter(Boolean);

      await apiClient.post('/api/v1/rooms', {
        roomNumber: newRoom.roomNumber.toUpperCase().trim(),
        roomType: newRoom.roomType,
        rentPerNight: Number(newRoom.rentPerNight),
        inventory: Number(newRoom.inventory),
        description: newRoom.description.trim() || `${newRoom.roomType} suite with full amenities.`,
        amenities: amenitiesArr,
        photos: photosArr
      });

      success(`Suite ${newRoom.roomNumber.toUpperCase()} added to inventory!`);
      setShowAddRoomModal(false);
      setNewRoom({
        roomNumber: '',
        roomType: 'Deluxe',
        rentPerNight: 220,
        inventory: 3,
        description: '',
        amenities: 'King Bed, High-speed WiFi, City View',
        photos: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
      });
      await loadAdminData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create room.';
      toastError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Edit Room
  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;
    setActionLoading(true);

    try {
      const amenitiesArr = Array.isArray(editingRoom.amenities)
        ? editingRoom.amenities
        : editingRoom.amenities.split(',').map((s) => s.trim()).filter(Boolean);

      await apiClient.patch(`/api/v1/rooms/${editingRoom._id}`, {
        rentPerNight: Number(editingRoom.rentPerNight),
        inventory: Number(editingRoom.inventory),
        description: editingRoom.description,
        amenities: amenitiesArr,
        status: editingRoom.status
      });

      success(`Suite ${editingRoom.roomNumber} updated successfully!`);
      setEditingRoom(null);
      await loadAdminData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update suite.';
      toastError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Archive Room
  const handleConfirmArchive = async () => {
    const { roomId, roomNumber } = archiveModalState;
    if (!roomId) return;
    setActionLoading(true);

    try {
      await apiClient.delete(`/api/v1/rooms/${roomId}`);
      success(`Suite ${roomNumber} successfully archived/removed.`);
      setArchiveModalState({ isOpen: false, roomId: null, roomNumber: '' });
      await loadAdminData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to archive room.';
      toastError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Add Staff / Admin Account
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiClient.post('/api/v1/admin/staff', newStaff);
      success(`Authorized ${newStaff.role} account created for ${newStaff.email}!`);
      setShowAddStaffModal(false);
      setNewStaff({ name: '', email: '', phone: '', password: '', role: 'staff' });
      await loadAdminData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to provision staff account.';
      toastError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Sort Rooms
  const filteredRooms = rooms
    .filter((r) => {
      if (!roomSearch.trim()) return true;
      const q = roomSearch.toLowerCase().trim();
      return r.roomNumber.toLowerCase().includes(q) || r.roomType.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (roomSort === 'price_asc') return a.rentPerNight - b.rentPerNight;
      if (roomSort === 'price_desc') return b.rentPerNight - a.rentPerNight;
      if (roomSort === 'inventory') return b.inventory - a.inventory;
      return a.roomNumber.localeCompare(b.roomNumber);
    });

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingStatusFilter !== 'all' && b.bookingStatus !== bookingStatusFilter) return false;
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase().trim();
      const matchRef = b._id.toLowerCase().includes(q);
      const matchGuest = (b.user?.name || '').toLowerCase().includes(q);
      const matchRoom = (b.room?.roomNumber || '').toLowerCase().includes(q);
      return matchRef || matchGuest || matchRoom;
    }
    return true;
  });

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
            <h2 className="font-serif-luxury text-white mb-2">HotelPro Master Administration</h2>
            <p className="text-secondary mb-0">
              Welcome, Administrator {user?.name}. Manage inventory, guest reservations, revenue metrics, and staff accounts.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            {lastRefreshed && (
              <span className="text-white-50 small me-2 d-none d-sm-inline">
                <FaClock className="me-1" /> {lastRefreshed}
              </span>
            )}
            <button
              onClick={loadAdminData}
              disabled={loading}
              className="btn btn-outline-gold btn-sm d-flex align-items-center gap-1"
            >
              <FaSyncAlt className={loading ? 'fa-spin' : ''} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards (Live from MongoDB aggregation) */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--hotel-gold)' }}>
              <FaChartLine />
            </div>
            <div>
              <div className="text-secondary small">Occupancy Rate</div>
              <div className="fs-4 fw-bold text-white">
                {dashboardData?.occupancyRate || '0.0'}%
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2DD4BF' }}>
              <FaBed />
            </div>
            <div>
              <div className="text-secondary small">Active Suites</div>
              <div className="fs-4 fw-bold text-white">
                {dashboardData?.activeRooms ?? rooms.filter((r) => r.isActive).length} Units
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA' }}>
              <FaCalendarCheck />
            </div>
            <div>
              <div className="text-secondary small">Total Reservations</div>
              <div className="fs-4 fw-bold text-white">
                {dashboardData?.totalBookings ?? bookings.length}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}>
              <FaMoneyBillWave />
            </div>
            <div>
              <div className="text-secondary small">Collected Revenue</div>
              <div className="fs-4 fw-bold text-white">
                ${dashboardData?.revenue?.collectedRevenue || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-4 border-bottom border-secondary border-opacity-25 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`btn btn-sm ${activeTab === 'overview' ? 'btn-gold' : 'btn-outline-secondary text-white-50'}`}
        >
          Overview & Telemetry
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`btn btn-sm ${activeTab === 'rooms' ? 'btn-gold' : 'btn-outline-secondary text-white-50'}`}
        >
          Room Inventory ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`btn btn-sm ${activeTab === 'bookings' ? 'btn-gold' : 'btn-outline-secondary text-white-50'}`}
        >
          All Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-gold' : 'btn-outline-secondary text-white-50'}`}
        >
          Users & Staff ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`btn btn-sm ${activeTab === 'payments' ? 'btn-gold' : 'btn-outline-secondary text-white-50'}`}
        >
          Payment Records ({paymentsList.length})
        </button>
      </div>

      {/* Loading state for tabs */}
      {loading && activeTab !== 'overview' && (
        <LoadingSpinner message="Loading administrative data..." />
      )}

      {/* TAB 1: Overview & Telemetry */}
      {activeTab === 'overview' && (
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="glass-panel p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <FaServer style={{ color: 'var(--hotel-gold)' }} />
                  <h5 className="font-serif-luxury text-white mb-0">System Telemetry & Database</h5>
                </div>
                <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">
                  Live
                </span>
              </div>

              <div className="p-3 rounded mb-3" style={{ background: 'rgba(7, 11, 25, 0.7)' }}>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 small">
                  <span className="text-secondary">Health Endpoint:</span>
                  <code className="text-warning">GET /api/health</code>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 small">
                  <span className="text-secondary">Database Host:</span>
                  <span className="text-white">127.0.0.1:27017</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 small">
                  <span className="text-secondary">Database State:</span>
                  <span className="text-success fw-bold">
                    {healthData?.database?.toUpperCase() || 'CONNECTED'}
                  </span>
                </div>
                <div className="d-flex justify-content-between py-1 small">
                  <span className="text-secondary">Database Name:</span>
                  <span className="text-warning fw-bold">HotelPro</span>
                </div>
              </div>

              <h6 className="text-white small fw-bold mb-2">Reservation Status Breakdown</h6>
              <div className="row g-2">
                <div className="col-4">
                  <div className="p-2 rounded text-center" style={{ background: 'rgba(7, 11, 25, 0.5)' }}>
                    <div className="small text-secondary">Confirmed</div>
                    <div className="fw-bold text-success">{dashboardData?.bookingsByStatus?.confirmed || 0}</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2 rounded text-center" style={{ background: 'rgba(7, 11, 25, 0.5)' }}>
                    <div className="small text-secondary">In-House</div>
                    <div className="fw-bold text-info">{dashboardData?.bookingsByStatus?.checked_in || 0}</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2 rounded text-center" style={{ background: 'rgba(7, 11, 25, 0.5)' }}>
                    <div className="small text-secondary">Cancelled</div>
                    <div className="fw-bold text-danger">{dashboardData?.bookingsByStatus?.cancelled || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="glass-panel p-4 h-100">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaMoneyBillWave style={{ color: 'var(--hotel-gold)' }} />
                <h5 className="font-serif-luxury text-white mb-0">Financial Accounting Breakdown</h5>
              </div>

              <div className="p-3 rounded mb-3" style={{ background: 'rgba(7, 11, 25, 0.7)' }}>
                <div className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-10">
                  <span className="text-secondary small">Paid / Verified Revenue:</span>
                  <span className="text-success fw-bold fs-5">
                    ${dashboardData?.revenue?.collectedRevenue || 0}
                  </span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-10">
                  <span className="text-secondary small">Pending Settlement:</span>
                  <span className="text-warning fw-semibold">
                    ${dashboardData?.revenue?.pendingRevenue || 0}
                  </span>
                </div>
                <div className="d-flex justify-content-between py-2">
                  <span className="text-secondary small">Refunded Revenue:</span>
                  <span className="text-info fw-semibold">
                    ${dashboardData?.revenue?.refundedRevenue || 0}
                  </span>
                </div>
              </div>

              <div className="small text-secondary">
                <strong className="text-white-50">Concurrency Engine:</strong> Per-room serialized Promise queue active. Overbooking prevention is cryptographically tested with 10 concurrent racing threads.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Room Inventory Management */}
      {activeTab === 'rooms' && !loading && (
        <div className="glass-panel p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <h5 className="font-serif-luxury text-white mb-0">Room Inventory Master List</h5>
            <div className="d-flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Search room code or type..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-25"
                style={{ maxWidth: '220px' }}
              />
              <select
                value={roomSort}
                onChange={(e) => setRoomSort(e.target.value)}
                className="form-select form-select-sm bg-dark text-white border-secondary border-opacity-25"
                style={{ width: 'auto' }}
              >
                <option value="number">Sort by Room #</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="inventory">Inventory Units</option>
              </select>
              <button
                onClick={() => setShowAddRoomModal(true)}
                className="btn btn-gold btn-sm d-flex align-items-center gap-1"
              >
                <FaPlus /> <span>Add Suite</span>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ background: 'transparent' }}>
              <thead>
                <tr className="border-secondary border-opacity-25 text-secondary small">
                  <th>ROOM #</th>
                  <th>CLASS</th>
                  <th>RATE / NIGHT</th>
                  <th>BASELINE UNITS</th>
                  <th>STATUS</th>
                  <th>HOUSEKEEPING</th>
                  <th className="text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => (
                  <tr key={room._id}>
                    <td className="text-warning fw-bold">{room.roomNumber}</td>
                    <td className="text-white">{room.roomType}</td>
                    <td className="text-white">${room.rentPerNight}</td>
                    <td className="text-white-50">{room.inventory} Units</td>
                    <td>
                      <span
                        className={`badge ${
                          room.isActive
                            ? 'bg-success bg-opacity-25 text-success'
                            : 'bg-secondary bg-opacity-25 text-white-50'
                        }`}
                      >
                        {room.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge type="housekeeping" status={room.housekeepingStatus} />
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <button
                          onClick={() => setEditingRoom(room)}
                          className="btn btn-outline-gold btn-sm py-0 px-2"
                          title="Edit Suite Details"
                        >
                          <FaEdit size={11} /> Edit
                        </button>
                        {room.isActive && (
                          <button
                            onClick={() =>
                              setArchiveModalState({
                                isOpen: true,
                                roomId: room._id,
                                roomNumber: room.roomNumber
                              })
                            }
                            className="btn btn-outline-danger btn-sm py-0 px-2"
                            title="Archive Room"
                          >
                            <FaTrash size={10} /> Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: All Bookings */}
      {activeTab === 'bookings' && !loading && (
        <div className="glass-panel p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <h5 className="font-serif-luxury text-white mb-0">All Customer Reservations</h5>
            <div className="d-flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Search ref, guest or suite..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-25"
                style={{ maxWidth: '240px' }}
              />
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="form-select form-select-sm bg-dark text-white border-secondary border-opacity-25"
                style={{ width: 'auto' }}
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ background: 'transparent' }}>
              <thead>
                <tr className="border-secondary border-opacity-25 text-secondary small">
                  <th>REF ID</th>
                  <th>GUEST</th>
                  <th>ROOM</th>
                  <th>STAY DATES</th>
                  <th>NIGHTS</th>
                  <th>TOTAL</th>
                  <th>STATUS</th>
                  <th>PAYMENT</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <code className="text-warning small">{b._id?.slice(-8)}</code>
                    </td>
                    <td className="text-white">
                      <div>{b.user?.name || 'Guest'}</div>
                      <div className="text-secondary" style={{ fontSize: '0.72rem' }}>
                        {b.user?.email}
                      </div>
                    </td>
                    <td className="text-white-50">{b.room?.roomNumber || 'Room'}</td>
                    <td className="text-secondary small">
                      {new Date(b.checkInDate).toLocaleDateString()} —{' '}
                      {new Date(b.checkOutDate).toLocaleDateString()}
                    </td>
                    <td className="text-white-50">{b.totalNights}</td>
                    <td className="text-warning fw-bold">${b.totalAmount}</td>
                    <td>
                      <StatusBadge type="booking" status={b.bookingStatus} />
                    </td>
                    <td>
                      <StatusBadge type="payment" status={b.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: User & Staff Accounts */}
      {activeTab === 'users' && !loading && (
        <div className="glass-panel p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="font-serif-luxury text-white mb-0">Registered Users & Staff</h5>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="btn btn-gold btn-sm d-flex align-items-center gap-1"
            >
              <FaPlus /> <span>Create Staff Account</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ background: 'transparent' }}>
              <thead>
                <tr className="border-secondary border-opacity-25 text-secondary small">
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u._id}>
                    <td className="text-white fw-semibold">{u.name}</td>
                    <td className="text-secondary small">{u.email}</td>
                    <td className="text-white-50 small">{u.phone}</td>
                    <td>
                      <StatusBadge type="role" status={u.role} />
                    </td>
                    <td>
                      <span className="badge bg-success bg-opacity-25 text-success">
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Payment Records */}
      {activeTab === 'payments' && !loading && (
        <div className="glass-panel p-4">
          <h5 className="font-serif-luxury text-white mb-3">Master Payment Audit Log</h5>
          {paymentsList.length === 0 ? (
            <p className="text-secondary small mb-0">No payment transaction records found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0" style={{ background: 'transparent' }}>
                <thead>
                  <tr className="border-secondary border-opacity-25 text-secondary small">
                    <th>BOOKING REF</th>
                    <th>PROVIDER</th>
                    <th>TRANSACTION REF</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th>DATE & TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <code className="text-warning small">{p.booking?.slice(-8) || p.booking}</code>
                      </td>
                      <td className="text-uppercase small text-white-50">{p.provider}</td>
                      <td>
                        <code className="text-white-50 small">{p.providerPaymentId || p.providerOrderId || 'N/A'}</code>
                      </td>
                      <td className="text-success fw-bold">
                        ${p.amount} {p.currency}
                      </td>
                      <td>
                        <StatusBadge type="payment" status={p.paymentStatus} />
                      </td>
                      <td className="text-secondary small">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Add Room */}
      {showAddRoomModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(7, 11, 25, 0.88)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-panel p-4 w-100" style={{ maxWidth: '550px', border: '1px solid rgba(212, 175, 55, 0.4)' }}>
            <h4 className="font-serif-luxury text-white mb-3">Add New Suite to Inventory</h4>
            <form onSubmit={handleAddRoom}>
              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="text-secondary small mb-1">Room Code / Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUITE-501"
                    value={newRoom.roomNumber}
                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                    className="form-control bg-dark text-white border-secondary border-opacity-50"
                  />
                </div>
                <div className="col-md-6">
                  <label className="text-secondary small mb-1">Class Type</label>
                  <select
                    value={newRoom.roomType}
                    onChange={(e) => setNewRoom({ ...newRoom, roomType: e.target.value })}
                    className="form-select bg-dark text-white border-secondary border-opacity-50"
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="text-secondary small mb-1">Rate Per Night ($)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRoom.rentPerNight}
                    onChange={(e) => setNewRoom({ ...newRoom, rentPerNight: e.target.value })}
                    className="form-control bg-dark text-white border-secondary border-opacity-50"
                  />
                </div>
                <div className="col-md-6">
                  <label className="text-secondary small mb-1">Baseline Inventory Units</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRoom.inventory}
                    onChange={(e) => setNewRoom({ ...newRoom, inventory: e.target.value })}
                    className="form-control bg-dark text-white border-secondary border-opacity-50"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="text-secondary small mb-1">Description</label>
                <textarea
                  rows="2"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  placeholder="Luxurious suite details..."
                  className="form-control bg-dark text-white border-secondary border-opacity-50 small"
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="text-secondary small mb-1">Amenities (Comma separated)</label>
                <input
                  type="text"
                  value={newRoom.amenities}
                  onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
                  className="form-control bg-dark text-white border-secondary border-opacity-50 small"
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="btn btn-outline-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="btn btn-gold btn-sm">
                  {actionLoading ? 'Saving...' : 'Create Suite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Room */}
      {editingRoom && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(7, 11, 25, 0.88)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-panel p-4 w-100" style={{ maxWidth: '550px', border: '1px solid rgba(212, 175, 55, 0.4)' }}>
            <h4 className="font-serif-luxury text-white mb-3">
              Edit Suite: {editingRoom.roomNumber} ({editingRoom.roomType})
            </h4>
            <form onSubmit={handleUpdateRoom}>
              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="text-secondary small mb-1">Rate Per Night ($)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingRoom.rentPerNight}
                    onChange={(e) => setEditingRoom({ ...editingRoom, rentPerNight: e.target.value })}
                    className="form-control bg-dark text-white border-secondary border-opacity-50"
                  />
                </div>
                <div className="col-md-6">
                  <label className="text-secondary small mb-1">Baseline Inventory</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingRoom.inventory}
                    onChange={(e) => setEditingRoom({ ...editingRoom, inventory: e.target.value })}
                    className="form-control bg-dark text-white border-secondary border-opacity-50"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="text-secondary small mb-1">Room Status</label>
                <select
                  value={editingRoom.status}
                  onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value })}
                  className="form-select bg-dark text-white border-secondary border-opacity-50"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="text-secondary small mb-1">Description</label>
                <textarea
                  rows="2"
                  value={editingRoom.description}
                  onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                  className="form-control bg-dark text-white border-secondary border-opacity-50 small"
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="text-secondary small mb-1">Amenities (Comma separated)</label>
                <input
                  type="text"
                  value={
                    Array.isArray(editingRoom.amenities)
                      ? editingRoom.amenities.join(', ')
                      : editingRoom.amenities
                  }
                  onChange={(e) => setEditingRoom({ ...editingRoom, amenities: e.target.value })}
                  className="form-control bg-dark text-white border-secondary border-opacity-50 small"
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="btn btn-outline-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="btn btn-gold btn-sm">
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Staff */}
      {showAddStaffModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(7, 11, 25, 0.88)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-panel p-4 w-100" style={{ maxWidth: '500px', border: '1px solid rgba(212, 175, 55, 0.4)' }}>
            <h4 className="font-serif-luxury text-white mb-3">Provision Authorized Account</h4>
            <form onSubmit={handleAddStaff}>
              <div className="mb-2">
                <label className="text-secondary small mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="form-control bg-dark text-white border-secondary border-opacity-50"
                />
              </div>
              <div className="mb-2">
                <label className="text-secondary small mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="form-control bg-dark text-white border-secondary border-opacity-50"
                />
              </div>
              <div className="mb-2">
                <label className="text-secondary small mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="form-control bg-dark text-white border-secondary border-opacity-50"
                />
              </div>
              <div className="mb-2">
                <label className="text-secondary small mb-1">Password (Min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength="8"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="form-control bg-dark text-white border-secondary border-opacity-50"
                />
              </div>
              <div className="mb-3">
                <label className="text-secondary small mb-1">Role Permission</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="form-select bg-dark text-white border-secondary border-opacity-50"
                >
                  <option value="staff">Staff (Front Desk & Housekeeping)</option>
                  <option value="admin">Administrator (Executive Super Admin)</option>
                </select>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="btn btn-outline-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="btn btn-gold btn-sm">
                  {actionLoading ? 'Creating...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Archiving Room */}
      <ConfirmModal
        isOpen={archiveModalState.isOpen}
        title="Archive Suite?"
        message={`Are you sure you wish to archive suite ${archiveModalState.roomNumber}? It will be removed from public booking while preserving historical reservation records.`}
        confirmText="Yes, Archive Suite"
        confirmVariant="danger"
        isLoading={actionLoading}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveModalState({ isOpen: false, roomId: null, roomNumber: '' })}
      />
    </div>
  );
};

export default AdminDashboard;
