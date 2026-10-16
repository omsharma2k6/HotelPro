const mongoose = require('mongoose');

/**
 * Payment Schema
 * 
 * SECURITY COMPLIANCE NOTE:
 * In compliance with PCI-DSS standards, full credit card numbers, CVV/CVC security codes,
 * card expiration dates, and sensitive authentication PINs are strictly prohibited and MUST NEVER
 * be stored in this schema or anywhere within the database.
 * Only sanitized provider identifiers (e.g., Stripe/Razorpay charge IDs) and high-level safe
 * status flags are recorded.
 */
const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required']
    },
    paymentProvider: {
      type: String,
      enum: {
        values: ['mock', 'stripe', 'razorpay', 'cash'],
        message: '{VALUE} is not a supported payment provider'
      },
      default: 'mock'
    },
    providerOrderId: {
      type: String,
      trim: true,
      default: null
    },
    providerPaymentId: {
      type: String,
      trim: true,
      default: null
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment amount cannot be negative']
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      trim: true,
      maxlength: [5, 'Currency code too long']
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'failed', 'refunded'],
        message: '{VALUE} is not a valid payment status'
      },
      default: 'pending'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ booking: 1, paymentStatus: 1 });
paymentSchema.index({ providerPaymentId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
