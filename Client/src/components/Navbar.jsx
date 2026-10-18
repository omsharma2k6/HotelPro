import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCrown, FaSignOutAlt, FaUserCircle, FaBed, FaHome, FaShieldAlt, FaConciergeBell, FaCalendarCheck } from 'react-icons/fa';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'staff') return '/staff/dashboard';
    return '/dashboard';
  };

  return (
    <nav className="navbar navbar-expand-lg hotel-navbar py-3">
      <div className="container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#070B19',
              boxShadow: '0 0 15px rgba(212, 175, 55, 0.35)'
            }}
          >
            <FaCrown size={20} />
          </div>
          <span className="font-serif-luxury text-white fs-4 fw-bold mb-0">
            Hotel<span style={{ color: 'var(--hotel-gold)' }}>Pro</span>
          </span>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#hotelNavbarContent"
          aria-controls="hotelNavbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ borderColor: 'rgba(212, 175, 55, 0.4)' }}
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        {/* Navigation Links */}
        <div className="collapse navbar-collapse" id="hotelNavbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
            <li className="nav-item">
              <NavLink to="/" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                <FaHome className="me-1 mb-1" /> Home
              </NavLink>
            </li>
            <li className="nav-item">
              <a href="/#suites-collection" className="nav-link-custom">
                <FaBed className="me-1 mb-1" /> Suites
              </a>
            </li>

            {/* Role-governed Dashboard Links */}
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink to="/my-bookings" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                    <FaCalendarCheck className="me-1 mb-1" /> My Bookings
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to={getDashboardRoute()}
                    className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
                  >
                    {user.role === 'admin' ? (
                      <>
                        <FaShieldAlt className="me-1 mb-1 text-warning" /> Admin Console
                      </>
                    ) : user.role === 'staff' ? (
                      <>
                        <FaConciergeBell className="me-1 mb-1 text-info" /> Staff Desk
                      </>
                    ) : (
                      <>
                        <FaUserCircle className="me-1 mb-1 text-success" /> Guest Portal
                      </>
                    )}
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          {/* User Status / Auth Actions */}
          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <div className="d-flex align-items-center gap-3">
                <div className="d-none d-md-flex flex-column text-end">
                  <span className="fw-semibold text-white small">{user.name}</span>
                  <div>
                    <span className={`badge-role-${user.role}`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-outline-gold btn-sm d-flex align-items-center gap-1"
                  title="Sign Out"
                >
                  <FaSignOutAlt />
                  <span className="d-none d-sm-inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-outline-gold btn-sm px-3">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-gold btn-sm px-3">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
