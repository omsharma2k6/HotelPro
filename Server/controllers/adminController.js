const AdminService = require('../services/adminService');
const RoomService = require('../services/roomService');
const BookingService = require('../services/bookingService');
const PaymentService = require('../services/paymentService');

/**
 * Admin Controller
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await AdminService.getDashboardMetrics();
    res.status(200).json({
      success: true,
      metrics
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const result = await AdminService.listUsers(req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getAdminRooms = async (req, res, next) => {
  try {
    // Include inactive/archived rooms for administrative oversight
    const result = await RoomService.listRooms({
      ...req.query,
      includeInactive: true
    });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getAdminBookings = async (req, res, next) => {
  try {
    const result = await BookingService.getAllBookings(req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getAdminPayments = async (req, res, next) => {
  try {
    const result = await PaymentService.listPayments(req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const createStaff = async (req, res, next) => {
  try {
    const staff = await AdminService.createStaffAccount(req.body);
    res.status(201).json({
      success: true,
      message: `Staff account '${staff.email}' created successfully`,
      staff
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getUsers,
  getAdminRooms,
  getAdminBookings,
  getAdminPayments,
  createStaff
};
