




// import React, { useState, useEffect, useMemo } from 'react';
// import { Link } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import api from '../utils/api'; // ✅ Axios instance imported

// const HistoryTable = () => {
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Filter states
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedAction, setSelectedAction] = useState('');
//   const [selectedUpdatedBy, setSelectedUpdatedBy] = useState('');

//   // ✅ Updated fetch function using axios instance
//   const fetchHistory = async () => {
//     try {
//       const response = await api.get('/history'); // ✅ No /api prefix needed (already in baseURL)
//       const data = response.data;
//       if (data.success) {
//         setHistory(data.data);
//       } else {
//         setError(data.error || 'Failed to load history.');
//       }
//     } catch (err) {
//       console.error('Fetch history error:', err);
//       setError(err.response?.data?.error || err.message || 'Failed to load history');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchHistory();
//   }, []);

//   // Compute unique values for dropdowns
//   const uniqueActions = useMemo(() => [...new Set(history.map(entry => entry.action))].sort(), [history]);
//   const uniqueUpdatedBy = useMemo(
//     () => [...new Set(history.map(e => (e.updatedByName || e.updatedBy?.username || 'Unknown')))].sort(),
//     [history]
//   );

//   // Filtered history based on search and dropdowns
//   const filteredHistory = useMemo(() => {
//     return history.filter(entry => {
//       const searchLower = searchTerm.toLowerCase();
//       const entryText = `${entry.product?.article || ''} ${entry.product?.color || ''} ${entry.product?.size || ''} ${entry.note || ''} ${(entry.updatedByName || entry.updatedBy?.username || '')}`.toLowerCase();

//       const matchesSearch = entryText.includes(searchLower);
//       const matchesAction = selectedAction ? entry.action === selectedAction : true;
//       const matchesUpdatedBy = selectedUpdatedBy
//         ? (entry.updatedByName || entry.updatedBy?.username || 'Unknown') === selectedUpdatedBy
//         : true;

//       return matchesSearch && matchesAction && matchesUpdatedBy;
//     });
//   }, [history, searchTerm, selectedAction, selectedUpdatedBy]);

//   // ✅ Updated delete handler using axios
//   const handleDelete = async (id) => {
//     if (!window.confirm(
//       '⚠ WARNING: Are you sure you want to delete this entry? This will revert stock changes and cannot be undone.'
//     )) return;
    
//     try {
//       const result = await api.delete(`/history/${id}`); // ✅ Using axios instance
//       if (result.data.success) {
//         setHistory(prev => prev.filter(item => item._id !== id));
//         toast.success('Entry deleted successfully.');
//       } else {
//         toast.error('Failed to delete: ' + (result.data.error || 'Unknown error'));
//       }
//     } catch (err) {
//       console.error('Delete error:', err);
//       toast.error('Error deleting entry: ' + (err.response?.data?.error || err.message));
//     }
//   };

//   // ✅ Updated permanent delete handler using axios
//   const handlePermanentDelete = async (row) => {
//     // safety: agar product ya product.article missing ho to ignore
//     if (!row.product || !row.product.article) {
//       toast.error('Permanent delete not possible: product field missing.');
//       return;
//     }
//     if (row.action === 'CHALLAN_OUT') return;  // double-safety

//     if (!window.confirm(
//           `🚨  '${row.product.article}' को पूरी तरह delete और सारी संबंधित salary 0 करनी है?`
//         )) return;

//     try {
//       const result = await api.post('/history/permanent-delete-article', { // ✅ Using axios instance
//         article: row.product.article,
//         gender : row.product.gender,   // ये फ़ील्ड मौजूद न हो तो backend ignore कर देगा
//         size   : row.product.size,
//         color  : row.product.color
//       });
      
//       if (result.data.success) {
//         toast.success('Article deleted & salaries reset');
//         fetchHistory();                 // तालिका रीफ़्रेश
//       } else {
//         toast.error(result.data.error || 'Permanent delete failed');
//       }
//     } catch (err) {
//       console.error('Permanent delete error:', err);
//       toast.error(err.response?.data?.error || err.message || 'Permanent delete failed');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="dashboard-bg min-vh-100 d-flex justify-content-center align-items-center">
//         <div className="spinner-border text-primary" role="status">
//           <span className="visually-hidden">Loading history...</span>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="dashboard-bg min-vh-100 d-flex justify-content-center align-items-center">
//         <div className="alert alert-danger" role="alert">
//           <h4 className="alert-heading">Error!</h4>
//           <p>{error}</p>
//           <button className="btn btn-outline-danger" onClick={() => {
//             setError(null);
//             setLoading(true);
//             fetchHistory();
//           }}>
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }
//  return (
//     <div className="dashboard-bg min-vh-100 py-4">
//       <style>{`
//         .dashboard-bg {
//           background: linear-gradient(135deg, #f8fbfd 0%, #e9eafc 60%, #f1f4fc 100%);
//           min-height: 100vh;
//         }
//         .card {
//           box-shadow: 0 8px 32px 0 rgba(85,76,219,0.08), 0 2px 8px rgba(60,72,126,0.12);
//           border-radius: 16px;
//           border: none;
//         }
//         .card-body {
//           background: rgba(255,255,255,0.98);
//           border-radius: 12px;
//         }
//         .search-input {
//           background: #f0f4fc;
//           border-radius: 10px;
//           border: 1px solid #d5dcf8;
//           padding: 12px 16px;
//         }
//         .filter-select {
//           background: #f0f4fc;
//           border-radius: 8px;
//           border: 1px solid #d5dcf8;
//           padding: 8px 12px;
//           min-width: 140px;
//         }
//         .table {
//           background: white;
//           border-radius: 10px;
//           overflow: hidden;
//         }
//         .table-dark {
//           background: linear-gradient(90deg, #6c7293 0%, #4a5568 100%);
//           color: white;
//         }
//         .table-hover tbody tr:hover {
//           background-color: #f5f2ff !important;
//           transition: background-color 0.2s ease;
//         }
//         .btn-action {
//           border-radius: 6px;
//           font-weight: 500;
//           padding: 8px 12px;
//           font-size: 12px;
//           margin: 2px;
//           border: none;
//           transition: all 0.2s ease;
//           min-width: 80px;
//         }
//         .btn-edit {
//           background: linear-gradient(45deg, #4CAF50, #45a049);
//           color: white;
//         }
//         .btn-edit:hover {
//           transform: translateY(-1px);
//           box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
//         }
//         .btn-delete {
//           background: linear-gradient(45deg, #f44336, #d32f2f);
//           color: white;
//         }
//         .btn-delete:hover {
//           transform: translateY(-1px);
//           box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
//         }
//         .btn-permanent {
//           background: linear-gradient(45deg, #333, #000);
//           color: white;
//           min-width: 110px;
//         }
//         .btn-permanent:hover {
//           transform: translateY(-1px);
//           box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
//         }
//         .btn-disabled {
//           opacity: 0.5;
//           cursor: not-allowed !important;
//           transform: none !important;
//           box-shadow: none !important;
//         }
//         .party-link {
//           background: linear-gradient(45deg, #007BFF, #0056b3);
//           color: white !important;
//           padding: 10px 16px;
//           border-radius: 8px;
//           text-decoration: none !important;
//           font-weight: 500;
//           transition: all 0.2s ease;
//           display: inline-block;
//         }
//         .party-link:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 6px 20px rgba(0, 123, 255, 0.3);
//           color: white !important;
//         }
//         .action-badge {
//           padding: 4px 8px;
//           border-radius: 12px;
//           font-size: 11px;
//           font-weight: 600;
//           text-transform: uppercase;
//         }
//         .action-add { background: #e8f5e8; color: #2e7d32; }
//         .action-update { background: #e3f2fd; color: #1565c0; }
//         .action-challan { background: #fff3e0; color: #ef6c00; }
//         .action-delete { background: #ffebee; color: #c62828; }
//         .text-truncate-custom {
//           max-width: 150px;
//           overflow: hidden;
//           text-overflow: ellipsis;
//           white-space: nowrap;
//         }
//         .operations-cell {
//           min-width: 280px;
//           white-space: nowrap;
//         }
//         @media (max-width: 768px) {
//           .table-responsive { font-size: 12px; }
//           .btn-action { padding: 6px 8px; font-size: 10px; min-width: 60px; }
//           .filter-controls { flex-direction: column !important; }
//           .btn-permanent { min-width: 80px; }
//         }
//       `}</style>

//       <div className="container-fluid">
//         <div className="card">
//           <div className="card-body">
//             <div className="d-flex justify-content-between align-items-center mb-4">
//               <h2 className="mb-0 text-primary">
//                 <i className="bi bi-clock-history me-2"></i>
//                 Stock History / Audit Trail
//               </h2>
//               <Link to="/party-summary" className="party-link">
//                 <i className="bi bi-people me-2"></i>
//                 Party Summary
//               </Link>
//             </div>

//             {/* Search and Filter Controls */}
//             <div className="row mb-4 filter-controls">
//               <div className="col-md-5 mb-3">
//                 <div className="input-group">
//                   <span className="input-group-text bg-light border-0">
//                     <i className="bi bi-search text-muted"></i>
//                   </span>
//                   <input
//                     type="text"
//                     className="form-control search-input border-0"
//                     placeholder="Search by article, color, size, note..."
//                     value={searchTerm}
//                     onChange={e => setSearchTerm(e.target.value)}
//                   />
//                 </div>
//               </div>
//               <div className="col-md-3 mb-3">
//                 <select
//                   className="form-select filter-select"
//                   value={selectedAction}
//                   onChange={e => setSelectedAction(e.target.value)}
//                 >
//                   <option value="">All Actions</option>
//                   {uniqueActions.map(action => (
//                     <option key={action} value={action}>{action}</option>
//                   ))}
//                 </select>
//               </div>
//               <div className="col-md-4 mb-3">
//                 <select
//                   className="form-select filter-select"
//                   value={selectedUpdatedBy}
//                   onChange={e => setSelectedUpdatedBy(e.target.value)}
//                 >
//                   <option value="">All Updated By</option>
//                   {uniqueUpdatedBy.map(name => (
//                     <option key={name} value={name}>{name}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             {/* Results Count */}
//             <div className="mb-3">
//               <small className="text-muted">
//                 Showing {filteredHistory.length} of {history.length} records
//               </small>
//             </div>

//             {/* Table */}
//             <div className="table-responsive">
//               <table className="table table-hover table-bordered">
//                 <thead className="table-dark">
//                   <tr>
//                     <th>Action</th>
//                     <th>Article</th>
//                     <th>Color</th>
//                     <th>Size</th>
//                     <th>Cartons</th>
//                     <th>Updated By</th>
//                     <th>Timestamp</th>
//                     <th>Note</th>
//                     <th>Operations</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredHistory.length === 0 ? (
//                     <tr>
//                       <td colSpan="9" className="text-center py-5">
//                         <div className="text-muted">
//                           <i className="bi bi-inbox fs-1 mb-3 d-block"></i>
//                           {searchTerm || selectedAction || selectedUpdatedBy
//                             ? 'No matching history records found.'
//                             : 'No history records found.'}
//                         </div>
//                       </td>
//                     </tr>
//                   ) : (
//                     filteredHistory.map(entry => (
//                       <tr key={entry._id}>
//                         <td>
//                           <span className={`action-badge action-${entry.action.toLowerCase()}`}>
//                             {entry.action}
//                           </span>
//                         </td>
//                         <td className="fw-medium">{entry.product?.article || 'N/A'}</td>
//                         <td>{entry.product?.color || 'N/A'}</td>
//                         <td>{entry.product?.size || 'N/A'}</td>
//                         <td className="text-center">
//                           <span className={`badge ${entry.quantityChanged > 0 ? 'bg-success' : entry.quantityChanged < 0 ? 'bg-danger' : 'bg-secondary'}`}>
//                             {entry.quantityChanged > 0 ? '+' : ''}{entry.quantityChanged}
//                           </span>
//                         </td>
//                         <td className="text-truncate-custom">
//                           {entry.updatedByName || entry.updatedBy?.username || 'Unknown'}
//                         </td>
//                         <td className="small">{new Date(entry.timestamp).toLocaleString()}</td>
//                         <td className="text-truncate-custom">
//                           {entry.partyName ? (
//                             <div className="small">
//                               <strong>Party:</strong> <Link to={`/party-summary?party=${encodeURIComponent(entry.partyName)}`} className="text-primary">{entry.partyName}</Link>
//                               <br />
//                               <strong>Invoice:</strong> {entry.invoiceNo || '-'}
//                             </div>
//                           ) : (entry.note || '-')}
//                         </td>
//                       <td className="operations-cell">
//   {/* Edit Button */}
//   {entry.action === 'ADD' || entry.action === 'UPDATE' ? (
//     <Link
//       to={entry.salaryEntryId ? `/salary-entry/edit/${entry.salaryEntryId}` : '#'}
//       className={`btn btn-action btn-edit text-decoration-none ${!entry.salaryEntryId ? 'btn-disabled' : ''}`}
//       onClick={(e) => {
//         if (!entry.salaryEntryId) {
//           e.preventDefault();
//           toast.error('Salary entry ID missing. Cannot edit old entries.');
//         }
//       }}
//       title={entry.salaryEntryId ? "Edit this specific entry" : "Cannot edit old entries"}
//     >
//       Edit
//     </Link>
//   ) : entry.action === 'CHALLAN_OUT' ? (
//     <Link
//       to={entry.challanId ? `/challan-out/edit/${entry.challanId}` : '#'}  // ✅ NO FALLBACK
//       className={`btn btn-action btn-edit text-decoration-none ${!entry.challanId ? 'btn-disabled' : ''}`}
//       onClick={(e) => {
//         if (!entry.challanId) {
//           e.preventDefault();
//           toast.error('Challan ID missing. Please run migration or contact admin.');
//         }
//       }}
//       title={entry.challanId ? "Edit this challan" : "Challan ID missing - cannot edit"}
//     >
//       Edit
//     </Link>
//   ) : (
//     <button
//       className="btn btn-action btn-edit btn-disabled"
//       disabled={true}
//       title="Edit is disabled for this action type"
//     >
//       Edit
//     </button>
//   )}

//   {/* Delete Button - ONLY enabled for CHALLAN_OUT */}
//   <button
//     className={`btn btn-action btn-delete ${entry.action !== 'CHALLAN_OUT' ? 'btn-disabled' : ''}`}
//     title={
//       entry.action !== 'CHALLAN_OUT'
//         ? 'Delete is only allowed for CHALLAN_OUT entries'
//         : 'Delete challan entry and revert stock'
//     }
//     onClick={() => {
//       if (entry.action === 'CHALLAN_OUT') {
//         handleDelete(entry._id);
//       }
//     }}
//     disabled={entry.action !== 'CHALLAN_OUT'}
//   >
//     Delete
//   </button>

//   {/* Permanent Delete Button */}
//   <button
//     className={`btn btn-action btn-permanent ${entry.action === 'CHALLAN_OUT' ? 'btn-disabled' : ''}`}
//     disabled={entry.action === 'CHALLAN_OUT'}
//     title={
//       entry.action === 'CHALLAN_OUT'
//         ? 'Permanent delete disabled for Challan OUT entries'
//         : 'Permanently remove this entry'
//     }
//     onClick={() => handlePermanentDelete(entry)}
//   >
//     Permanent Delete
//   </button>
// </td>


//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default HistoryTable;

import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

const PAGE_SIZE = 50;

const HistoryTable = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState('');

  // ---------- API with pagination ----------
  const fetchHistory = useCallback(
  async (targetPage = 1) => {
    try {
      setPageLoading(true);

      const response = await api.get('/history', {
        params: { page: targetPage, limit: PAGE_SIZE },
      });
      const data = response.data;

      if (data.success) {
        setHistory(data.data || []);
        setPage(data.page || targetPage);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || (data.data ? data.data.length : 0));
        setError(null);
      } else {
        setError(data.error || 'Failed to load history.');
      }
    } catch (err) {
      console.error('Fetch history error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load history');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  },
  [] // <- koi dependency nahi
);

 useEffect(() => {
  fetchHistory(1);
}, [fetchHistory]);


  // Compute unique values for dropdowns
  const uniqueActions = useMemo(
    () => [...new Set(history.map(entry => entry.action))].sort(),
    [history]
  );
  const uniqueUpdatedBy = useMemo(
    () =>
      [...new Set(
        history.map(e => (e.updatedByName || e.updatedBy?.username || 'Unknown'))
      )].sort(),
    [history]
  );

  // Filtered history based on search and dropdowns
  const filteredHistory = useMemo(() => {
    return history.filter(entry => {
      const searchLower = searchTerm.toLowerCase();
      const entryText = `${entry.product?.article || ''} ${entry.product?.color || ''} ${entry.product?.size || ''} ${entry.note || ''} ${(entry.updatedByName || entry.updatedBy?.username || '')}`.toLowerCase();

      const matchesSearch = entryText.includes(searchLower);
      const matchesAction = selectedAction ? entry.action === selectedAction : true;
      const matchesUpdatedBy = selectedUpdatedBy
        ? (entry.updatedByName || entry.updatedBy?.username || 'Unknown') === selectedUpdatedBy
        : true;

      return matchesSearch && matchesAction && matchesUpdatedBy;
    });
  }, [history, searchTerm, selectedAction, selectedUpdatedBy]);

  // delete
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        '⚠ WARNING: Are you sure you want to delete this entry? This will revert stock changes and cannot be undone.'
      )
    ) return;

    const prev = history;
    setHistory(prev.filter(item => item._id !== id));

    try {
      const result = await api.delete(`/history/${id}`);
      if (result.data.success) {
        toast.success('Entry deleted successfully.');
      } else {
        toast.error('Failed to delete: ' + (result.data.error || 'Unknown error'));
        setHistory(prev);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Error deleting entry: ' + (err.response?.data?.error || err.message));
      setHistory(prev);
    }
  };

  // permanent delete
  const handlePermanentDelete = async (row) => {
    if (!row.product || !row.product.article) {
      toast.error('Permanent delete not possible: product field missing.');
      return;
    }
    if (row.action === 'CHALLAN_OUT') return;

    if (
      !window.confirm(
        `🚨  '${row.product.article}' को पूरी तरह delete और सारी संबंधित salary 0 करनी है?`
      )
    ) return;

    try {
      const result = await api.post('/history/permanent-delete-article', {
        article: row.product.article,
        gender: row.product.gender,
        size: row.product.size,
        color: row.product.color,
      });

      if (result.data.success) {
        toast.success('Article deleted & salaries reset');
        fetchHistory(page);
      } else {
        toast.error(result.data.error || 'Permanent delete failed');
      }
    } catch (err) {
      console.error('Permanent delete error:', err);
      toast.error(err.response?.data?.error || err.message || 'Permanent delete failed');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
          <button
            className="btn btn-outline-danger"
            onClick={() => {
              setError(null);
              fetchHistory(1);
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-bg min-vh-100 py-4">
      <style>{`
        .dashboard-bg {
          background: linear-gradient(135deg, #f8fbfd 0%, #e9eafc 60%, #f1f4fc 100%);
          min-height: 100vh;
        }
        .card {
          box-shadow: 0 8px 32px 0 rgba(85,76,219,0.08), 0 2px 8px rgba(60,72,126,0.12);
          border-radius: 16px;
          border: none;
        }
        .card-body {
          background: rgba(255,255,255,0.98);
          border-radius: 12px;
        }
        .search-input {
          background: #f0f4fc;
          border-radius: 10px;
          border: 1px solid #d5dcf8;
          padding: 12px 16px;
        }
        .filter-select {
          background: #f0f4fc;
          border-radius: 8px;
          border: 1px solid #d5dcf8;
          padding: 8px 12px;
          min-width: 140px;
        }
        .table {
          background: white;
          border-radius: 10px;
          overflow: hidden;
        }
        .table-dark {
          background: linear-gradient(90deg, #6c7293 0%, #4a5568 100%);
          color: white;
        }
        .table-hover tbody tr:hover {
          background-color: #f5f2ff !important;
          transition: background-color 0.2s ease;
        }
        .btn-action {
          border-radius: 6px;
          font-weight: 500;
          padding: 8px 12px;
          font-size: 12px;
          margin: 2px;
          border: none;
          transition: all 0.2s ease;
          min-width: 80px;
        }
        .btn-edit {
          background: linear-gradient(45deg, #4CAF50, #45a049);
          color: white;
        }
        .btn-edit:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
        }
        .btn-delete {
          background: linear-gradient(45deg, #f44336, #d32f2f);
          color: white;
        }
        .btn-delete:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
        }
        .btn-permanent {
          background: linear-gradient(45deg, #333, #000);
          color: white;
          min-width: 110px;
        }
        .btn-permanent:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        .btn-disabled {
          opacity: 0.5;
          cursor: not-allowed !important;
          transform: none !important;
          box-shadow: none !important;
        }
        .party-link {
          background: linear-gradient(45deg, #007BFF, #0056b3);
          color: white !important;
          padding: 10px 16px;
          border-radius: 8px;
          text-decoration: none !important;
          font-weight: 500;
          transition: all 0.2s ease;
          display: inline-block;
        }
        .party-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 123, 255, 0.3);
          color: white !important;
        }
        .action-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .action-add { background: #e8f5e8; color: #2e7d32; }
        .action-update { background: #e3f2fd; color: #1565c0; }
        .action-challan { background: #fff3e0; color: #ef6c00; }
        .action-delete { background: #ffebee; color: #c62828; }
        .text-truncate-custom {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .operations-cell {
          min-width: 280px;
          white-space: nowrap;
        }
        @media (max-width: 768px) {
          .table-responsive { font-size: 12px; }
          .btn-action { padding: 6px 8px; font-size: 10px; min-width: 60px; }
          .filter-controls { flex-direction: column !important; }
          .btn-permanent { min-width: 80px; }
        }
      `}</style>

      <div className="container-fluid">
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0 text-primary">
                <i className="bi bi-clock-history me-2"></i>
                Stock History / Audit Trail
              </h2>
              <Link to="/party-summary" className="party-link">
                <i className="bi bi-people me-2"></i>
                Party Summary
              </Link>
            </div>

            {/* Search and Filter Controls */}
            <div className="row mb-4 filter-controls">
              <div className="col-md-5 mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-light border-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control search-input border-0"
                    placeholder="Search by article, color, size, note..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <select
                  className="form-select filter-select"
                  value={selectedAction}
                  onChange={e => setSelectedAction(e.target.value)}
                >
                  <option value="">All Actions</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <select
                  className="form-select filter-select"
                  value={selectedUpdatedBy}
                  onChange={e => setSelectedUpdatedBy(e.target.value)}
                >
                  <option value="">All Updated By</option>
                  {uniqueUpdatedBy.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-3">
              <small className="text-muted">
                Showing {filteredHistory.length} of {totalCount} records (page {page} / {totalPages})
              </small>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="table table-hover table-bordered">
                <thead className="table-dark">
                  <tr>
                    <th>Action</th>
                    <th>Article</th>
                    <th>Color</th>
                    <th>Size</th>
                    <th>Cartons</th>
                    <th>Updated By</th>
                    <th>Timestamp</th>
                    <th>Note</th>
                    <th>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5">
                        <div className="text-muted">
                          <i className="bi bi-inbox fs-1 mb-3 d-block"></i>
                          {searchTerm || selectedAction || selectedUpdatedBy
                            ? 'No matching history records found.'
                            : 'No history records found.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map(entry => (
                      <tr key={entry._id}>
                        <td>
                          <span className={`action-badge action-${entry.action.toLowerCase()}`}>
                            {entry.action}
                          </span>
                        </td>
                        <td className="fw-medium">{entry.product?.article || 'N/A'}</td>
                        <td>{entry.product?.color || 'N/A'}</td>
                        <td>{entry.product?.size || 'N/A'}</td>
                        <td className="text-center">
                          <span className={`badge ${
                            entry.quantityChanged > 0
                              ? 'bg-success'
                              : entry.quantityChanged < 0
                              ? 'bg-danger'
                              : 'bg-secondary'
                          }`}>
                            {entry.quantityChanged > 0 ? '+' : ''}{entry.quantityChanged}
                          </span>
                        </td>
                        <td className="text-truncate-custom">
                          {entry.updatedByName || entry.updatedBy?.username || 'Unknown'}
                        </td>
                        <td className="small">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td className="text-truncate-custom">
                          {entry.partyName ? (
                            <div className="small">
                              <strong>Party:</strong>{' '}
                              <Link
                                to={`/party-summary?party=${encodeURIComponent(entry.partyName)}`}
                                className="text-primary"
                              >
                                {entry.partyName}
                              </Link>
                              <br />
                              <strong>Invoice:</strong> {entry.invoiceNo || '-'}
                            </div>
                          ) : (entry.note || '-')}
                        </td>
                        <td className="operations-cell">
                          {/* Edit Button */}
                          {entry.action === 'ADD' || entry.action === 'UPDATE' ? (
                            <Link
                              to={entry.salaryEntryId ? `/salary-entry/edit/${entry.salaryEntryId}` : '#'}
                              className={`btn btn-action btn-edit text-decoration-none ${
                                !entry.salaryEntryId ? 'btn-disabled' : ''
                              }`}
                              onClick={(e) => {
                                if (!entry.salaryEntryId) {
                                  e.preventDefault();
                                  toast.error('Salary entry ID missing. Cannot edit old entries.');
                                }
                              }}
                              title={entry.salaryEntryId
                                ? 'Edit this specific entry'
                                : 'Cannot edit old entries'}
                            >
                              Edit
                            </Link>
                          ) : entry.action === 'CHALLAN_OUT' ? (
                            <Link
                              to={entry.challanId ? `/challan-out/edit/${entry.challanId}` : '#'}
                              className={`btn btn-action btn-edit text-decoration-none ${
                                !entry.challanId ? 'btn-disabled' : ''
                              }`}
                              onClick={(e) => {
                                if (!entry.challanId) {
                                  e.preventDefault();
                                  toast.error(
                                    'Challan ID missing. Please run migration or contact admin.'
                                  );
                                }
                              }}
                              title={entry.challanId
                                ? 'Edit this challan'
                                : 'Challan ID missing - cannot edit'}
                            >
                              Edit
                            </Link>
                          ) : (
                            <button
                              className="btn btn-action btn-edit btn-disabled"
                              disabled
                              title="Edit is disabled for this action type"
                            >
                              Edit
                            </button>
                          )}

                          {/* Delete Button - ONLY enabled for CHALLAN_OUT */}
                          <button
                            className={`btn btn-action btn-delete ${
                              entry.action !== 'CHALLAN_OUT' ? 'btn-disabled' : ''
                            }`}
                            title={
                              entry.action !== 'CHALLAN_OUT'
                                ? 'Delete is only allowed for CHALLAN_OUT entries'
                                : 'Delete challan entry and revert stock'
                            }
                            onClick={() => {
                              if (entry.action === 'CHALLAN_OUT') {
                                handleDelete(entry._id);
                              }
                            }}
                            disabled={entry.action !== 'CHALLAN_OUT'}
                          >
                            Delete
                          </button>

                          {/* Permanent Delete Button */}
                          <button
                            className={`btn btn-action btn-permanent ${
                              entry.action === 'CHALLAN_OUT' ? 'btn-disabled' : ''
                            }`}
                            disabled={entry.action === 'CHALLAN_OUT'}
                            title={
                              entry.action === 'CHALLAN_OUT'
                                ? 'Permanent delete disabled for Challan OUT entries'
                                : 'Permanently remove this entry'
                            }
                            onClick={() => handlePermanentDelete(entry)}
                          >
                            Permanent Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination buttons */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <button
                className="btn btn-outline-secondary"
                disabled={page <= 1 || pageLoading}
                onClick={() => fetchHistory(page - 1)}
              >
                ← Prev
              </button>

              <span className="text-muted small">
                Page {page} of {totalPages}
              </span>

              <button
                className="btn btn-outline-secondary"
                disabled={page >= totalPages || pageLoading}
                onClick={() => fetchHistory(page + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryTable;
