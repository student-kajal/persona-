
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

// Assume Font Awesome is imported: import { FaUserCircle, FaSignOutAlt, FaBox, FaFileInvoice, FaHistory, FaPlus } from 'react-icons/fa';
// Or use <i className="fas fa-..."></i> with CDN

const logoUrl = process.env.PUBLIC_URL + '/logo.png';

const Layout = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4" style={{ borderBottom: '1px solid #e9ecef' }}>
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
            <img src={logoUrl} alt="GPFAX" height="38" style={{ borderRadius: 4 }} />
            <span className="fw-bold" style={{ letterSpacing: 1, color: '#007bff' }}>GPFAX Inventory</span>
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center gap-1" to="/products">
                  <i className="fas fa-box me-1" style={{ color: '#6c757d' }}></i> View All Products
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center gap-1" to="/products/salary-report">
                  <i className="fas fa-file-invoice-dollar me-1" style={{ color: '#6c757d' }}></i> Salary Report
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link fw-bold d-flex align-items-center gap-1" to="/history" style={{ color: '#007bff' }}>
                  <i className="fas fa-history me-1"></i> History & Reports
                </Link>
              </li>
            </ul>

            <ul className="navbar-nav ms-auto d-flex align-items-center">
              {/* Action Buttons */}
              <li className="nav-item me-2">
                <Link 
                  className="btn btn-success btn-sm d-flex align-items-center gap-1" 
                  to="/challans/add" 
                  style={{ 
                    background: 'linear-gradient(135deg, #28a745, #218838)', 
                    border: 'none', 
                    transition: 'transform 0.2s' 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <i className="fas fa-plus"></i> Create Challan
                </Link>
              </li>
              <li className="nav-item me-3">
                <Link 
                  className="btn btn-primary btn-sm d-flex align-items-center gap-1" 
                  to="/products/add" 
                  style={{ 
                    background: 'linear-gradient(135deg, #007bff, #0062cc)', 
                    border: 'none', 
                    transition: 'transform 0.2s' 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <i className="fas fa-plus"></i> Add Product
                </Link>
              </li>

              {/* User Info & Logout */}
              <li className="nav-item dropdown">
                <button 
                  className="nav-link dropdown-toggle d-flex align-items-center btn btn-link border-0" 
                  id="userDropdown" 
                  type="button"
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  style={{ textDecoration: 'none', color: '#343a40' }}
                >
                  <i className="fas fa-user-circle me-1" style={{ fontSize: '1.2rem', color: '#007bff' }}></i>
                  {user?.email || 'User'}
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0" aria-labelledby="userDropdown" style={{ minWidth: '200px' }}>
                  <li><h6 className="dropdown-header fw-bold" style={{ color: '#007bff' }}>Welcome, {user?.name || user?.email}</h6></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <Outlet />

      {/* Footer */}
      <footer className="bg-dark text-white mt-auto py-4" style={{ background: 'linear-gradient(135deg, #343a40, #212529)' }}>
        <div className="container text-center">
          <p className="mb-0" style={{ fontSize: '0.875rem' }}>&copy; {new Date().getFullYear()} GPFAX Industries. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Layout;
