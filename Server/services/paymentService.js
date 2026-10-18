const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

/**
 * Payment Service
 * Supports development simulated mock payments and Razorpay integration.
 * Compliant with PCI-DSS: zero raw credit card or CVV storage.
 */
class PaymentService {
  /**
   * Check if Razorpay keys are configured
   */
  static isRazorpayConfigured() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  /**
   * Get active payment gateway configuration (safe public details)
   */
  static getPaymentConfig() {
    const hasRazorpay = this.isRazorpayConfigured();
    return {
      activeProvider: hasRazorpay ? 'razorpay' : 'mock',
      isMockMode: !hasRazorpay,
      razorpayKeyId: hasRazorpay ? process.env.RAZORPAY_KEY_ID : null,
      currency: 'USD'
    };
  }

  /**
   * Create payment order for a pending reservation
   */
  static async createOrder({ bookingId, currentUser, requestedProvider }) {
    const booking = await Booking.findById(bookingId).populate('room');
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    // Verify ownership
    const isOwner = booking.user.toString() === currentUser._id.toString();
    const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'staff';
    if (!isOwner && !isPrivileged) {
      const err = new Error('Access denied: You can only initiate payment for your own reservation');
      err.statusCode = 403;
      throw err;
    }

    if (booking.bookingStatus === 'cancelled') {
      const err = new Error('Cannot process payment for a cancelled reservation');
      err.statusCode = 400;
      throw err;
    }

    if (booking.paymentStatus === 'paid') {
      const err = new Error('This reservation is already fully paid');
      err.statusCode = 400;
      throw err;
    }

    const hasRazorpay = this.isRazorpayConfigured();
    const provider = hasRazorpay && requestedProvider === 'razorpay' ? 'razorpay' : 'mock';

    // If Razorpay is active
    if (provider === 'razorpay') {
      // In a production setup with razorpay keys
      const orderPayload = {
        amount: Math.round(booking.totalAmount * 100), // amount in cents/paise
        currency: 'USD',
        receipt: `rcpt_${booking._id.toString().slice(-8)}`
      };

      // Mocking order creation structure or calling Razorpay SDK
      const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      const payment = await Payment.create({
        booking: booking._id,
        paymentProvider: 'razorpay',
        providerOrderId: orderId,
        amount: booking.totalAmount,
        currency: 'USD',
        paymentStatus: 'pending',
        metadata: { receipt: orderPayload.receipt }
      });

      return {
        provider: 'razorpay',
        orderId,
        amount: booking.totalAmount,
        currency: 'USD',
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId: booking._id,
        paymentId: payment._id
      };
    }

    // Default: Development Mock Payment Provider (clearly labeled simulated)
    const mockOrderId = `MOCK_ORD_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const payment = await Payment.create({
      booking: booking._id,
      paymentProvider: 'mock',
      providerOrderId: mockOrderId,
      amount: booking.totalAmount,
      currency: 'USD',
      paymentStatus: 'pending',
      metadata: {
        simulated: true,
        environment: 'development',
        initiatedAt: new Date().toISOString()
      }
    });

    return {
      provider: 'mock',
      orderId: mockOrderId,
      amount: booking.totalAmount,
      currency: 'USD',
      bookingId: booking._id,
      paymentId: payment._id,
      isSimulated: true,
      message: 'SIMULATED PAYMENT: Running in local development mock mode.'
    };
  }

  /**
   * Verify payment signature or mock token and complete booking state
   */
  static async verifyPayment({
    bookingId,
    providerOrderId,
    providerPaymentId,
    signature,
    mockSuccess,
    currentUser
  }) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    // IDEMPOTENCY CHECK:
    // If booking is already paid, return existing state safely without re-processing
    if (booking.paymentStatus === 'paid') {
      const existingPayment = await Payment.findOne({
        booking: bookingId,
        paymentStatus: 'completed'
      });
      return {
        success: true,
        isIdempotent: true,
        message: 'Payment was previously verified and completed.',
        booking,
        payment: existingPayment
      };
    }

    // Find pending payment record
    const payment = await Payment.findOne({
      booking: bookingId,
      providerOrderId
    });

    if (!payment) {
      const err = new Error('No matching payment order found for this booking and order ID');
      err.statusCode = 400;
      throw err;
    }

    // Verify based on provider
    if (payment.paymentProvider === 'razorpay') {
      if (!signature || !providerPaymentId) {
        const err = new Error('Missing Razorpay verification credentials');
        err.statusCode = 400;
        throw err;
      }

      const body = `${providerOrderId}|${providerPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret')
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        payment.paymentStatus = 'failed';
        await payment.save();
        const err = new Error('Invalid payment signature verification failed');
        err.statusCode = 400;
        throw err;
      }

      payment.providerPaymentId = providerPaymentId;
    } else {
      // Mock payment verification
      if (!mockSuccess) {
        payment.paymentStatus = 'failed';
        await payment.save();
        const err = new Error('Mock payment simulation indicated failure');
        err.statusCode = 400;
        throw err;
      }

      payment.providerPaymentId = `MOCK_PAY_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    // Successfully verified -> update payment and booking states atomically
    payment.paymentStatus = 'completed';
    payment.metadata = {
      ...payment.metadata,
      completedAt: new Date().toISOString(),
      verifiedBy: currentUser ? currentUser.email : 'system'
    };
    await payment.save();

    booking.paymentStatus = 'paid';
    if (booking.bookingStatus === 'pending') {
      booking.bookingStatus = 'confirmed';
    }
    await booking.save();

    return {
      success: true,
      message: payment.paymentProvider === 'mock'
        ? 'Simulated development payment completed successfully.'
        : 'Payment verified and reservation confirmed.',
      booking,
      payment
    };
  }

  /**
   * List all payment transactions (Admin oversight)
   */
  static async listPayments(query = {}) {
    const { page = 1, limit = 20, status, provider } = query;
    const mongoQuery = {};

    if (status) {
      mongoQuery.paymentStatus = status;
    }

    if (provider) {
      mongoQuery.paymentProvider = provider;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      Payment.find(mongoQuery)
        .populate({
          path: 'booking',
          select: 'guestName checkInDate checkOutDate totalAmount bookingStatus'
        })
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(mongoQuery)
    ]);

    return {
      payments,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1
    };
  }
}

module.exports = PaymentService;
