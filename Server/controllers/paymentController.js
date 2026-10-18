const PaymentService = require('../services/paymentService');

/**
 * Payment Controller
 */
const getPaymentConfig = (req, res) => {
  const config = PaymentService.getPaymentConfig();
  res.status(200).json({
    success: true,
    config
  });
};

const createOrder = async (req, res, next) => {
  try {
    const { bookingId, paymentProvider } = req.body;
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'bookingId is required to initiate payment order'
      });
    }

    const order = await PaymentService.createOrder({
      bookingId,
      currentUser: req.user,
      requestedProvider: paymentProvider
    });

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      providerOrderId,
      providerPaymentId,
      signature,
      mockSuccess
    } = req.body;

    if (!bookingId || !providerOrderId) {
      return res.status(400).json({
        success: false,
        message: 'bookingId and providerOrderId are required for verification'
      });
    }

    const result = await PaymentService.verifyPayment({
      bookingId,
      providerOrderId,
      providerPaymentId,
      signature,
      mockSuccess: mockSuccess !== undefined ? mockSuccess : true,
      currentUser: req.user
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getPayments = async (req, res, next) => {
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

module.exports = {
  getPaymentConfig,
  createOrder,
  verifyPayment,
  getPayments
};
