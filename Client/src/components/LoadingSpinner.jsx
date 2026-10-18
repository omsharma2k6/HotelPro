import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'md' }) => {
  const spinnerSize = size === 'sm' ? '1.5rem' : size === 'lg' ? '3rem' : '2.2rem';

  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div
        className="spinner-border"
        role="status"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          color: 'var(--hotel-gold)',
          borderWidth: '0.2em'
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <p className="text-secondary small mt-3 mb-0">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
