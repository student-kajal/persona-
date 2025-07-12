// // import React from 'react';
// // import { Outlet, Link } from 'react-router-dom';

// // const logoUrl = process.env.PUBLIC_URL + '/logo.png';

// // const Layout = () => (
// //   <>
// //     {/* Navbar (with dropdown) */}
// //     <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
// //       <div className="container">
// //         <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
// //           <img src={logoUrl} alt="GPFAX" height="38" style={{ borderRadius: 4 }} />
// //           <span className="fw-bold" style={{ letterSpacing: 1 }}>GPFAX Inventory</span>
// //         </Link>
// //         <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
// //           <span className="navbar-toggler-icon"></span>
// //         </button>
// //         <div className="collapse navbar-collapse" id="mainNav">
// //           <ul className="navbar-nav me-auto mb-2 mb-lg-0">
// //             {/* Products Dropdown */}
// //             <li className="nav-item dropdown">
// //               <button
// //                 className="nav-link dropdown-toggle btn btn-link"
// //                 type="button"
// //                 id="productsDropdown"
// //                 data-bs-toggle="dropdown"
// //                 aria-expanded="false"
// //                 style={{ textDecoration: 'none' }}
// //               >
// //                 All Products
// //               </button>
// //               <ul className="dropdown-menu" aria-labelledby="productsDropdown">
// //                 <li><Link className="dropdown-item fw-bold" to="/products">View All Products</Link></li>
// //                 <li><hr className="dropdown-divider" /></li>
// //                 <li><h6 className="dropdown-header">PU</h6></li>
// //                 <li><Link className="dropdown-item" to="/products/pu/gents">PU Gents</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/pu/ladies">PU Ladies</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/pu/kids-male">PU Kids Male</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/pu/kids-female">PU Kids Female</Link></li>
// //                 <li><hr className="dropdown-divider" /></li>
// //                 <li><h6 className="dropdown-header">EVA</h6></li>
// //                 <li><Link className="dropdown-item" to="/products/eva/gents">EVA Gents</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/eva/ladies">EVA Ladies</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/eva/kids-male">EVA Kids Male</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/eva/kids-female">EVA Kids Female</Link></li>
// //                 <li><hr className="dropdown-divider" /></li>
// //                 <li><h6 className="dropdown-header">NEW</h6></li>
// //                 <li><Link className="dropdown-item" to="/products/new/gents">NEW Gents</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/new/ladies">NEW Ladies</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/new/kids-male">NEW Kids Male</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/new/kids-female">NEW Kids Female</Link></li>
// //               </ul>
// //             </li>
// //             <li className="nav-item"><Link className="nav-link" to="/products/history">Stock History</Link></li>
// //             <li className="nav-item"><Link className="nav-link" to="/products/salary-report">Salary Report</Link></li>
// //             <li className="nav-item"><Link className="nav-link" to="/challans">Challan PDF</Link></li>
// //           </ul>
// //           <ul className="navbar-nav ms-auto">
// //             <li className="nav-item">
// //               <Link className="btn btn-primary ms-2" to="/products/add">+ Add Product</Link>
// //             </li>
// //           </ul>
// //         </div>
// //       </div>
// //     </nav>

// //     {/* Main Content */}
// //     <Outlet />

// //     {/* Footer */}
// //     <footer className="bg-dark text-white mt-5 py-4">
// //       <div className="container text-center">
// //         &copy; {new Date().getFullYear()} GPFAX Industries. All rights reserved.
// //       </div>
// //     </footer>
// //   </>
// // );

// // export default Layout;
// // import React from 'react';
// // import { Outlet, Link } from 'react-router-dom';

// // const logoUrl = process.env.PUBLIC_URL + '/logo.png';

// // const Layout = () => (
// //   <>
// //     {/* Navbar (with dropdown) */}
// //     <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
// //       <div className="container">
// //         <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
// //           <img src={logoUrl} alt="GPFAX" height="38" style={{ borderRadius: 4 }} />
// //           <span className="fw-bold" style={{ letterSpacing: 1 }}>GPFAX Inventory</span>
// //         </Link>
// //         <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
// //           <span className="navbar-toggler-icon"></span>
// //         </button>
// //         <div className="collapse navbar-collapse" id="mainNav">
// //           <ul className="navbar-nav me-auto mb-2 mb-lg-0">
// //             {/* Products Dropdown */}
// //             <li className="nav-item dropdown">
// //               <button
// //                 className="nav-link dropdown-toggle btn btn-link"
// //                 type="button"
// //                 id="productsDropdown"
// //                 data-bs-toggle="dropdown"
// //                 aria-expanded="false"
// //                 style={{ textDecoration: 'none' }}
// //               >
// //                 All Products
// //               </button>
// //               <ul className="dropdown-menu" aria-labelledby="productsDropdown">
// //                 <li><Link className="dropdown-item fw-bold" to="/products">View All Products</Link></li>
// //                 <li><hr className="dropdown-divider" /></li>
// //                 <li><h6 className="dropdown-header">PU</h6></li>
// //                 <li><Link className="dropdown-item" to="/products/pu/gents">PU Gents</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/pu/ladies">PU Ladies</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/pu/kids-male">PU Kids Male</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/pu/kids-female">PU Kids Female</Link></li>
// //                 <li><hr className="dropdown-divider" /></li>
// //                 <li><h6 className="dropdown-header">EVA</h6></li>
// //                 <li><Link className="dropdown-item" to="/products/eva/gents">EVA Gents</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/eva/ladies">EVA Ladies</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/eva/kids-male">EVA Kids Male</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/eva/kids-Female">EVA kids Female</Link></li>
// //                 <li><hr className="dropdown-divider" /></li>
// //                 <li><h6 className="dropdown-header">NEW</h6></li>
// //                 <li><Link className="dropdown-item" to="/products/new/gents">NEW Gents</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/new/ladies">NEW Ladies</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/new/kids-male">NEW Kids Male</Link></li>
// //                 <li><Link className="dropdown-item" to="/products/new/kids-female">NEW Kids Female</Link></li>
// //               </ul>
// //             </li>
// //             <li className="nav-item"><Link className="nav-link" to="/products/history">Stock History</Link></li>
// //             <li className="nav-item"><Link className="nav-link" to="/products/salary-report">Salary Report</Link></li>
// //           </ul>
// //           <ul className="navbar-nav ms-auto">
// //             <li className="nav-item">
// //               <Link className="btn btn-success ms-2" to="/challans/add">
// //                 + Create Challan
// //               </Link>
// //             </li>
// //             <li className="nav-item">
// //               <Link className="btn btn-primary ms-2" to="/products/add">
// //                 + Add Product
// //               </Link>
// //             </li>
            
// //           </ul>
// //         </div>
// //       </div>
// //     </nav>

// //     {/* Main Content */}
// //     <Outlet />

// //     {/* Footer */}
// //     <footer className="bg-dark text-white mt-5 py-4">
// //       <div className="container text-center">
// //         &copy; {new Date().getFullYear()} GPFAX Industries. All rights reserved.
// //       </div>
// //     </footer>
// //   </>
// // );

// // export default Layout;
// import React from 'react';
// import { Outlet, Link } from 'react-router-dom';

// const logoUrl = process.env.PUBLIC_URL + '/logo.png';

// const Layout = () => (
//   <>
//     <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
//       <div className="container">
//         <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
//           <img src={logoUrl} alt="GPFAX" height="38" style={{ borderRadius: 4 }} />
//           <span className="fw-bold" style={{ letterSpacing: 1 }}>GPFAX Inventory</span>
//         </Link>
//         <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
//           <span className="navbar-toggler-icon"></span>
//         </button>
//         <div className="collapse navbar-collapse" id="mainNav">
//           <ul className="navbar-nav me-auto mb-2 mb-lg-0">
//             <li className="nav-item">
//               <Link className="nav-link" to="/products">
//                 View All Products
//               </Link>
//             </li>
            
//             <li className="nav-item">
//               <Link className="nav-link" to="/products/salary-report">Salary Report</Link>
//             </li>
//           </ul>
//           <ul className="navbar-nav ms-auto">
//             <li className="nav-item">
//               <Link className="btn btn-success ms-2" to="/challans/add">
//                 + Create Challan
//               </Link>
//             </li>
//             <li className="nav-item">
//               <Link className="btn btn-primary ms-2" to="/products/add">
//                 + Add Product
//               </Link>
//             </li>
//           </ul>
//         </div>
//       </div>
//     </nav>

//     <Outlet />

//     <footer className="bg-dark text-white mt-5 py-4">
//       <div className="container text-center">
//         &copy; {new Date().getFullYear()} GPFAX Industries. All rights reserved.
//       </div>
//     </footer>
//   </>
// );

// export default Layout;
import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const logoUrl = process.env.PUBLIC_URL + '/logo.png';

const Layout = () => (
  <>
    {/* Navbar */}
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img src={logoUrl} alt="GPFAX" height="38" style={{ borderRadius: 4 }} />
          <span className="fw-bold" style={{ letterSpacing: 1 }}>GPFAX Inventory</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/products">View All Products</Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/products/salary-report">Salary Report</Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link fw-bold text-primary" to="/history">📜 History & Reports</Link>
            </li>
          </ul>

          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="btn btn-success ms-2" to="/challans/add">
                + Create Challan
              </Link>
            </li>
            <li className="nav-item">
              <Link className="btn btn-primary ms-2" to="/products/add">
                + Add Product
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    {/* Page Content */}
    <Outlet />

    {/* Footer */}
    <footer className="bg-dark text-white mt-5 py-4">
      <div className="container text-center">
        &copy; {new Date().getFullYear()} GPFAX Industries. All rights reserved.
      </div>
    </footer>
  </>
);

export default Layout;
