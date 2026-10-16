import React from 'react';
import { Link } from 'react-router-dom';
import { FaCompass, FaHome } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="container py-5 my-auto text-center">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="glass-panel p-5">
            <div
              className="mx-auto mb-3"
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.15)',
                color: 'var(--hotel-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}
            >
              <FaCompass />
            </div>
            <h1 className="font-serif-luxury text-white display-3 fw-bold mb-2">404</h1>
            <h3 className="font-serif-luxury text-white mb-3">Suite Not Found</h3>
            <p className="text-secondary small mb-4">
              The page or resource you are looking for does not exist or may have been relocated.
            </p>
            <Link to="/" className="btn btn-gold px-4 py-2">
              <FaHome className="me-2" /> Return to Sanctuary
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
