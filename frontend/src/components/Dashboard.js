

// import React from 'react';
// import { Outlet, Link } from 'react-router-dom';

// const logoUrl = process.env.PUBLIC_URL + '/logo.png';

// const Layout = () => (
//   <>
//     {/* Navbar */}
//     <nav className="navbar navbar-expand-md navbar-light bg-white shadow-sm mb-4 sticky-top">
//       <div className="container-fluid">
//         <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
//           <img src={logoUrl} alt="GPFAX" height="36" style={{ borderRadius: 4 }} />
//           <span className="fw-bold" style={{ letterSpacing: 1 }}>GPFAX Inventory</span>
//         </Link>
//         <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
//           <span className="navbar-toggler-icon"></span>
//         </button>

//         <div className="collapse navbar-collapse" id="mainNav">
//           <ul className="navbar-nav me-auto mb-2 mb-md-0">
//             <li className="nav-item">
//               <Link className="nav-link" to="/products">All Products</Link>
//             </li>
//             <li className="nav-item">
//               <Link className="nav-link" to="/products/salary-report">Salary Report</Link>
//             </li>
//             <li className="nav-item">
//               <Link className="nav-link fw-bold text-primary" to="/history">📜 History</Link>
//             </li>
//           </ul>

//           <div className="d-flex flex-wrap gap-2 mt-2 mt-md-0">
//             <Link className="btn btn-success" to="/challans/add">+ Challan</Link>
//             <Link className="btn btn-primary" to="/products/add">+ Product</Link>
//           </div>
//         </div>
//       </div>
//     </nav>

//     {/* Page Content */}
//     <Outlet />

//     {/* Footer */}
//     <footer className="bg-dark text-white mt-5 py-4">
//       <div className="container text-center">
//         &copy; {new Date().getFullYear()} GPFAX Industries. All rights reserved.
//       </div>
//     </footer>
//   </>
// );

// export default Layout;
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBoxOpen, FaCubes } from 'react-icons/fa';
import api from '../utils/api';
import Calculator from '../components/Calculator';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    deletedProducts: 0
  });

  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/products');
        const products = res.data.data || [];
        setStats({
          totalProducts: products.length,
          totalStock: products.reduce((sum, p) => sum + (p.cartons * p.pairPerCarton), 0),
          deletedProducts: products.filter(p => p.isDeleted).length
        });
      } catch {
        setStats({ totalProducts: 0, totalStock: 0, deletedProducts: 0 });
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="container py-4 position-relative">

      <h2 className="text-center mb-5 fw-bold">
        Welcome to <span className="text-primary">GPFAX Inventory Dashboard</span>
      </h2>

      {/* Cards */}
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="card border-primary shadow-sm text-center h-100">
            <div className="card-body">
              <FaBoxOpen size={32} className="text-primary mb-2" />
              <h5 className="card-title">Total Products</h5>
              <p className="display-6 fw-bold text-primary">{stats.totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card border-success shadow-sm text-center h-100">
            <div className="card-body">
              <FaCubes size={32} className="text-success mb-2" />
              <h5 className="card-title">Total Pairs in Stock</h5>
              <p className="display-6 fw-bold text-success">{stats.totalStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculator Toggle Button */}
      <div className="my-4 d-flex justify-content-center">
        <button
          onClick={() => setShowCalculator(prev => !prev)}
          className="btn btn-outline-primary"
        >
          {showCalculator ? 'Hide Calculator' : 'Show Calculator'}
        </button>
      </div>

      {/* Calculator Slide-in Panel */}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: showCalculator ? '10px' : '-260px',
          width: '240px',
          transition: 'right 0.3s ease-in-out',
          zIndex: 1050
        }}
      >
        <Calculator />
      </div>

      <hr className="my-5" />
      
      {/* Buttons */}
      <div className="d-flex flex-wrap gap-2 justify-content-center">
        <Link to="/products/add" className="btn btn-primary">+ Add Product</Link>
        <Link to="/products" className="btn btn-outline-dark">All Products</Link>
        <Link to="/products/deleted" className="btn btn-outline-danger">Deleted Products</Link>
        <Link to="/products/salary-report" className="btn btn-outline-secondary">Salary Report</Link>
        <Link to="/challans" className="btn btn-outline-warning">Challan PDF</Link>
      </div>
    </div>
  );
};

export default Dashboard;
