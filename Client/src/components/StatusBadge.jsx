import React from 'react';

/**
 * Standardized status badge component across HotelPro
 */
const StatusBadge = ({ type, status }) => {
  const norm = (status || '').toLowerCase().trim();

  // 1. Booking Status
  if (type === 'booking') {
    switch (norm) {
      case 'confirmed':
        return (
          <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-2 py-1">
            Confirmed
          </span>
        );
      case 'checked_in':
        return (
          <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25 px-2 py-1">
            Checked In
          </span>
        );
      case 'checked_out':
        return (
          <span className="badge bg-secondary bg-opacity-25 text-white-50 border border-secondary border-opacity-25 px-2 py-1">
            Checked Out
          </span>
        );
      case 'completed':
        return (
          <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25 px-2 py-1">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 px-2 py-1">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25 px-2 py-1">
            Pending Hold
          </span>
        );
    }
  }

  // 2. Payment Status
  if (type === 'payment') {
    switch (norm) {
      case 'paid':
        return (
          <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-2 py-1">
            Paid & Verified
          </span>
        );
      case 'refunded':
        return (
          <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25 px-2 py-1">
            Refunded
          </span>
        );
      case 'failed':
        return (
          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 px-2 py-1">
            Payment Failed
          </span>
        );
      default:
        return (
          <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25 px-2 py-1">
            Payment Pending
          </span>
        );
    }
  }

  // 3. Housekeeping Status
  if (type === 'housekeeping') {
    switch (norm) {
      case 'clean':
        return (
          <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-2 py-1">
            Clean & Ready
          </span>
        );
      case 'dirty':
        return (
          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 px-2 py-1">
            Dirty (Needs Turnover)
          </span>
        );
      case 'cleaning_in_progress':
        return (
          <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25 px-2 py-1">
            Cleaning in Progress
          </span>
        );
      case 'inspected':
        return (
          <span className="badge bg-primary bg-opacity-25 text-info border border-info border-opacity-25 px-2 py-1">
            Supervisor Inspected
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary bg-opacity-25 text-white-50 px-2 py-1">
            {norm || 'Unknown'}
          </span>
        );
    }
  }

  // 4. Role Status
  if (type === 'role') {
    return <span className={`badge-role-${norm}`}>{norm}</span>;
  }

  return (
    <span className="badge bg-secondary bg-opacity-25 text-white-50 px-2 py-1 text-capitalize">
      {norm}
    </span>
  );
};

export default StatusBadge;
