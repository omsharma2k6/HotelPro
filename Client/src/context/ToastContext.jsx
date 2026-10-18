import React, { createContext, useContext, useState, useCallback } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'danger', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, success, error, info, warning, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="toast-container position-fixed bottom-0 end-0 p-3"
        style={{ zIndex: 9999, maxWidth: '400px', pointerEvents: 'none' }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast show align-items-center mb-2 border-0 shadow-lg text-white`}
            style={{
              background:
                toast.type === 'success'
                  ? 'rgba(14, 38, 25, 0.95)'
                  : toast.type === 'danger'
                  ? 'rgba(45, 15, 20, 0.95)'
                  : toast.type === 'warning'
                  ? 'rgba(45, 35, 10, 0.95)'
                  : 'rgba(14, 22, 47, 0.95)',
              borderLeft: `4px solid ${
                toast.type === 'success'
                  ? '#22c55e'
                  : toast.type === 'danger'
                  ? '#ef4444'
                  : toast.type === 'warning'
                  ? '#eab308'
                  : 'var(--hotel-gold)'
              }`,
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              pointerEvents: 'auto',
              transition: 'all 0.3s ease'
            }}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="d-flex p-3">
              <div className="me-2 mt-1">
                {toast.type === 'success' && <FaCheckCircle className="text-success" />}
                {toast.type === 'danger' && <FaExclamationCircle className="text-danger" />}
                {toast.type === 'warning' && <FaExclamationCircle className="text-warning" />}
                {toast.type === 'info' && <FaInfoCircle style={{ color: 'var(--hotel-gold)' }} />}
              </div>
              <div className="toast-body p-0 flex-grow-1 small" style={{ wordBreak: 'break-word' }}>
                {toast.message}
              </div>
              <button
                type="button"
                className="btn-close btn-close-white ms-2 m-auto"
                onClick={() => removeToast(toast.id)}
                aria-label="Close"
                style={{ fontSize: '0.75rem' }}
              ></button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
