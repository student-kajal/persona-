// // import React, { useEffect, useState } from "react";
// // import { useParams, useNavigate } from "react-router-dom";
// // import api from "../utils/api"; // Aapka API utility file
// // import { toast } from "react-toastify";

// // const SalaryEntryEdit = () => {
// //   const { id } = useParams(); // SalaryEntry ID
// //   const navigate = useNavigate();
  
// //   const [entry, setEntry] = useState(null);
// //   const [cartons, setCartons] = useState("");
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   useEffect(() => {
// //     const fetchEntry = async () => {
// //       try {
// //         // Hum backend se SalaryEntry ka data fetch karenge
// //         // Iske liye aapko backend mein ek naya GET endpoint banana hoga
// //        // const res = await api.get(`/salary-entry/${id}`); 
// //        const res = await api.get(`/salary/${id}`); 
// //         if (res.data.success) {
// //           setEntry(res.data.data);
// //           setCartons(res.data.data.cartons);
// //         } else {
// //           throw new Error(res.data.error || "Failed to fetch entry");
// //         }
// //       } catch (err) {
// //         setError(err.message);
// //         toast.error("Error loading data: " + err.message);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     if (id) {
// //       fetchEntry();
// //     }
// //   }, [id]);

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setLoading(true);
// //     try {
// //       // Hum patchSalaryEntry wale endpoint ko call karenge
// //       await api.patch(`/salary/${id}`, { cartons: Number(cartons) });
// //       toast.success("Entry updated successfully!");
// //       navigate("/history"); // Edit ke baad history page par wapas bhej dein
// //     } catch (err) {
// //       toast.error(err.response?.data?.error || "Failed to update entry");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   if (loading) return <div>Loading...</div>;
// //   if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

// //   return (
// //     <div className="container">
// //       <h2>Edit Salary Contribution</h2>
// //       {entry && (
// //         <form onSubmit={handleSubmit} className="card p-4 mt-3">
// //           <p><strong>Worker:</strong> {entry.createdBy}</p>
// //           <p><strong>Article:</strong> {entry.article}</p>
          
// //           <div className="col-md-4">
// //             <label className="form-label">Cartons</label>
// //             <input
// //               type="number"
// //               className="form-control"
// //               value={cartons}
// //               onChange={(e) => setCartons(e.target.value)}
// //               min="0"
// //               required
// //             />
// //           </div>

// //           <div className="mt-4">
// //             <button type="submit" className="btn btn-primary me-2" disabled={loading}>
// //               {loading ? "Saving..." : "Update Entry"}
// //             </button>
// //             <button type="button" className="btn btn-secondary" onClick={() => navigate("/history")}>
// //               Cancel
// //             </button>
// //           </div>
// //         </form>
// //       )}
// //     </div>
// //   );
// // };

// // export default SalaryEntryEdit;
// // src/pages/SalaryEntryEdit.jsx
// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import api from "../utils/api";
// import { toast } from "react-toastify";

// export default function SalaryEntryEdit() {
//   const { id } = useParams();                 // salaryEntry _id
//   const navigate = useNavigate();

//   // ---- state ----
//   const [entry, setEntry]         = useState(null); // full salaryEntry doc
//   const [cartons, setCartons]     = useState("");   // editable input
//   const [origCartons, setOrig]    = useState(0);    // value before editing
//   const [baseTotal, setBaseTotal] = useState(0);    // total BEFORE editing
//   const [loading, setLoading]     = useState(true);
//   const [error, setError]         = useState(null);

//   // ---- fetch once ----
//   useEffect(() => {
//     (async () => {
//       try {
//         const res  = await api.get(`/salary/${id}`);
//         const doc  = res.data.data;

//         // product totals
//         const prod = await api.get(`/products/${doc.product}`);
//         const total = prod.data.totalCartons || 0;  // सही key + default 0

//         setEntry(doc);
//         setCartons(doc.cartons);
//         setOrig(doc.cartons);
//         setBaseTotal(total);
//       } catch (err) {
//         setError(err.message);
//         toast.error(err.message);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [id]);

//   // ---- derived live total ----
//   const liveTotal = baseTotal - origCartons + Number(cartons || 0);

//   // ---- input handler ----
//   const onCartonChange = (e) => setCartons(e.target.value);

//   // ---- submit ----
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       setLoading(true);
//       await api.patch(`/salary/${id}`, { cartons: Number(cartons) });
//       toast.success("Entry updated!");
//       navigate("/products");  // Redirect to main table page for auto-refresh
//     } catch (err) {
//       toast.error(err.response?.data?.error || "Update failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div>Loading…</div>;
//   if (error)   return <div style={{ color: "red" }}>Error: {error}</div>;

//   return (
//     <div className="container">
//       <h2>Edit Salary Contribution</h2>
//       <form onSubmit={handleSubmit} className="card p-4 mt-3">
//         <p><strong>Worker:</strong>  {entry.createdBy}</p>
//         <p><strong>Article:</strong> {entry.article}</p>

//         <div className="col-md-4">
//           <label className="form-label">Cartons</label>
//           <input
//             type="number"
//             className="form-control"
//             value={cartons}
//             onChange={onCartonChange}
//             min="0"
//             required
//           />
//         </div>

//         <p className="mt-3">
//           <b>Total Cartons (All Users): {liveTotal}</b>
//         </p>

//         <div className="mt-4">
//           <button className="btn btn-primary me-2" disabled={loading}>
//             {loading ? "Saving…" : "Update Entry"}
//           </button>
//           <button type="button" className="btn btn-secondary"
//                   onClick={() => navigate("/history")}>
//             Cancel
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-toastify";

export default function SalaryEntryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ---- state ----
  const [entry, setEntry] = useState(null);
  const [cartons, setCartons] = useState("");
  const [origCartons, setOrig] = useState(0);
  const [baseTotal, setBaseTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- fetch once ----
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/salary/${id}`);
        const doc = res.data.data;

        // product totals
        const prod = await api.get(`/products/${doc.product}`);
        const total = prod.data.totalCartons || 0;

        setEntry(doc);
        setCartons(doc.cartons);
        setOrig(doc.cartons);
        setBaseTotal(total);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ---- derived live total ----
  const liveTotal = baseTotal - origCartons + Number(cartons || 0);

  // ---- input handler ----
  const onCartonChange = (e) => setCartons(e.target.value);

  // ---- submit ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.patch(`/salary/${id}`, { cartons: Number(cartons) });
      toast.success("Entry updated!");
      navigate("/products");
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="alert alert-danger">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-bg min-vh-100 py-2">
      <style>{`
        .dashboard-bg {
          background: linear-gradient(135deg, #f1f3f4 0%, #e8eaf6 50%, #f3e5f5 100%);
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .edit-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          max-width: 420px;
          margin: 0 auto;
          overflow: hidden;
        }
        
        .card-header-custom {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem;
          text-align: center;
        }
        
        .header-icon {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 0.5rem;
          font-size: 1.2rem;
        }
        .header-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}

        .info-row {
          display: flex;
          gap: 1rem;
          margin: 1rem 0;
        }
        
        .info-card {
          flex: 1;
          background: #f8f9ff;
          border: 1px solid #e1e8f7;
          border-radius: 8px;
          padding: 0.75rem;
          text-align: center;
        }
        
        .form-control-compact {
          width: 100%;
          padding: 0.6rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        
        .form-control-compact:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .total-compact {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          border-radius: 10px;
          padding: 1rem;
          text-align: center;
          margin: 1rem 0;
        }
        
        .btn-compact {
          padding: 0.6rem 1.2rem;
          font-size: 0.9rem;
          font-weight: 600;
          border-radius: 8px;
          transition: all 0.3s ease;
          border: none;
        }
        
        .btn-primary-compact {
          background: #4a5568;
          color: white;
        }
        
        .btn-primary-compact:hover {
          background: #2d3748;
          transform: translateY(-1px);
          color: white;
        }
        
        .btn-secondary-compact {
          background: white;
          color: #4a5568;
          border: 2px solid #e2e8f0;
        }
        
        .btn-secondary-compact:hover {
          background: #f7fafc;
          color: #2d3748;
        }
        
        .original-badge {
          background: #fff5f5;
          border: 1px solid #feb2b2;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          color: #c53030;
          margin-top: 0.25rem;
          display: inline-block;
        }
        
        @media (max-width: 768px) {
          .edit-card { margin: 0.5rem; max-width: none; }
          .info-row { flex-direction: column; gap: 0.5rem; }
        }
      `}</style>

      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="edit-card">
              {/* Compact Header */}
              <div className="card-header-custom">
               <div className="header-icon">
  <img src="/logo.png" alt="Logo" className="header-logo" />
</div>

                <h4 className="mb-1">Edit Salary Contribution</h4>
                <small className="opacity-75">Update carton quantities</small>
              </div>
              
              {/* Compact Body */}
              <div className="p-3">
                {/* Info Row */}
                <div className="info-row">
                  <div className="info-card">
                    <small className="text-muted d-block">Worker</small>
                    <strong className="text-dark">{entry.createdBy}</strong>
                  </div>
                  <div className="info-card">
                    <small className="text-muted d-block">Article</small>
                    <strong className="text-dark">{entry.article}</strong>
                  </div>
                </div>

                {/* Compact Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-uppercase">
                      <i className="bi bi-boxes me-1"></i> Cartons
                    </label>
                    <input
                      type="number"
                      className="form-control-compact"
                      value={cartons}
                      onChange={onCartonChange}
                      min="0"
                      required
                      placeholder="Enter quantity..."
                    />
                    <div className="original-badge">
                      Original: {origCartons}
                    </div>
                  </div>

                  {/* Compact Total */}
                  <div className="total-compact">
                    <div className="d-flex justify-content-between align-items-center">
                      <span><i className="bi bi-calculator me-1"></i> Live Total</span>
                      <span className="fs-4 fw-bold">{liveTotal}</span>
                    </div>
                  </div>

                  {/* Compact Buttons */}
                  <div className="row g-2">
                    <div className="col-6">
                      <button 
                        type="submit" 
                        className={`btn-compact btn-primary-compact w-100 ${loading ? 'opacity-50' : ''}`} 
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check me-1"></i>
                            Update
                          </>
                        )}
                      </button>
                    </div>
                    <div className="col-6">
                      <button 
                        type="button" 
                        className="btn-compact btn-secondary-compact w-100"
                        onClick={() => navigate("/history")}
                        disabled={loading}
                      >
                        <i className="bi bi-x me-1"></i>
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
