import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you wish to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger', 'gold', 'primary'
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: 'rgba(7, 11, 25, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass-panel w-100 p-4 position-relative"
        style={{
          maxWidth: '480px',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '16px'
        }}
      >
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="btn btn-sm position-absolute top-0 end-0 m-3 text-secondary"
          style={{ background: 'transparent', border: 'none', fontSize: '1.2rem' }}
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <div className="d-flex align-items-start gap-3 mb-3">
          <div
            className="p-3 rounded-circle flex-shrink-0"
            style={{
              background:
                confirmVariant === 'danger'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(212, 175, 55, 0.15)',
              color: confirmVariant === 'danger' ? '#ef4444' : 'var(--hotel-gold)',
              fontSize: '1.4rem'
            }}
          >
            <FaExclamationTriangle />
          </div>
          <div>
            <h4 className="font-serif-luxury text-white mb-1">{title}</h4>
            <p className="text-secondary small mb-0">{message}</p>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 pt-2 border-top border-secondary border-opacity-10">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-outline-secondary btn-sm px-3"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`btn btn-${confirmVariant === 'danger' ? 'danger' : 'gold'} btn-sm px-4 d-inline-flex align-items-center gap-2`}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
