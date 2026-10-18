const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

/**
 * Admin Management Service
 * Telemetry, real metrics aggregation, safe user administration, and staff provisioning
 */
class AdminService {
  /**
   * Calculate live hotel operations and financial telemetry from MongoDB
   */
  static async getDashboardMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalRooms,
      activeRooms,
      maintenanceRooms,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      checkedInBookings,
      checkedOutBookings,
      cancelledBookings,
      completedBookings,
      revenueResult,
      totalCapacityResult,
      activeStaysToday,
      totalUsers,
      totalStaff
    ] = await Promise.all([
      Room.countDocuments({}),
      Room.countDocuments({ isActive: true, status: 'available' }),
      Room.countDocuments({ status: 'maintenance' }),
      Booking.countDocuments({}),
      Booking.countDocuments({ bookingStatus: 'pending' }),
      Booking.countDocuments({ bookingStatus: 'confirmed' }),
      Booking.countDocuments({ bookingStatus: 'checked_in' }),
      Booking.countDocuments({ bookingStatus: 'checked_out' }),
      Booking.countDocuments({ bookingStatus: 'cancelled' }),
      Booking.countDocuments({ bookingStatus: 'completed' }),
      // Calculate total collected revenue from completed payments
      Payment.aggregate([
        { $match: { paymentStatus: { $in: ['completed', 'paid'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      // Calculate total active room inventory units
      Room.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalUnits: { $sum: '$inventory' } } }
      ]),
      // Active stays for today
      Booking.countDocuments({
        bookingStatus: { $in: ['confirmed', 'checked_in'] },
        checkInDate: { $lte: tomorrow },
        checkOutDate: { $gt: today }
      }),
      User.countDocuments({ role: 'guest' }),
      User.countDocuments({ role: 'staff' })
    ]);

    const totalRevenue = revenueResult[0] ? revenueResult[0].totalRevenue : 0;
    const totalInventoryUnits = totalCapacityResult[0] ? totalCapacityResult[0].totalUnits : 0;

    // Calculate real dynamic occupancy rate based on current occupied inventory
    const occupancyRate =
      totalInventoryUnits > 0
        ? parseFloat(((activeStaysToday / totalInventoryUnits) * 100).toFixed(1))
        : 0;

    return {
      totalRooms,
      activeRooms,
      totalBookings,
      occupancyRate,
      revenue: {
        collectedRevenue: totalRevenue,
        pendingRevenue: 0,
        refundedRevenue: 0
      },
      bookingsByStatus: {
        pending: pendingBookings,
        confirmed: confirmedBookings,
        checked_in: checkedInBookings,
        checked_out: checkedOutBookings,
        cancelled: cancelledBookings,
        completed: completedBookings
      },
      rooms: {
        total: totalRooms,
        active: activeRooms,
        maintenance: maintenanceRooms,
        totalInventoryUnits
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        checkedIn: checkedInBookings,
        checkedOut: checkedOutBookings,
        cancelled: cancelledBookings,
        completed: completedBookings,
        activeToday: activeStaysToday
      },
      financials: {
        totalCollectedRevenue: totalRevenue,
        currency: 'USD'
      },
      occupancy: {
        currentRatePercent: occupancyRate,
        occupiedUnitsToday: activeStaysToday,
        totalUnits: totalInventoryUnits
      },
      users: {
        guests: totalUsers,
        staff: totalStaff
      },
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * List users safely without exposing password hashes or tokens
   */
  static async listUsers(query = {}) {
    const { page = 1, limit = 20, role, search, sort = '-createdAt' } = query;
    const mongoQuery = {};

    if (role) {
      mongoQuery.role = role;
    }

    if (search) {
      mongoQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(mongoQuery)
        .select('-passwordHash -__v')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(mongoQuery)
    ]);

    return {
      users,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1
    };
  }

  /**
   * Provision a staff account (Admin privilege only)
   */
  static async createStaffAccount({ name, email, phone, password }) {
    if (!name || !email || !phone || !password) {
      const err = new Error('Name, email, phone, and password are all required');
      err.statusCode = 400;
      throw err;
    }

    if (password.length < 8) {
      const err = new Error('Staff password must be at least 8 characters long');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      const err = new Error(`User with email '${normalizedEmail}' already exists`);
      err.statusCode = 400;
      throw err;
    }

    const passwordHash = await User.hashPassword(password);

    const staffUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      role: 'staff',
      isActive: true
    });

    return {
      id: staffUser._id,
      name: staffUser.name,
      email: staffUser.email,
      phone: staffUser.phone,
      role: staffUser.role,
      isActive: staffUser.isActive,
      createdAt: staffUser.createdAt
    };
  }
}

module.exports = AdminService;
