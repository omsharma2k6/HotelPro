import React, { Component } from 'react';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HotelPro ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 my-auto text-center">
          <div
            className="glass-panel p-5 mx-auto"
            style={{ maxWidth: '600px', border: '1px solid rgba(212, 175, 55, 0.3)' }}
          >
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: '70px',
                height: '70px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                fontSize: '2rem'
              }}
            >
              <FaExclamationTriangle />
            </div>

            <h3 className="font-serif-luxury text-white mb-2">Something Went Wrong</h3>
            <p className="text-secondary small mb-4">
              An unexpected error occurred while rendering this view. Your session and account remain completely safe.
            </p>

            <div className="d-flex justify-content-center gap-3">
              <button onClick={this.handleReload} className="btn btn-gold btn-sm d-flex align-items-center gap-1">
                <FaRedo size={12} /> Reload Application
              </button>
              <button onClick={this.handleHome} className="btn btn-outline-light btn-sm d-flex align-items-center gap-1">
                <FaHome size={12} /> Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
