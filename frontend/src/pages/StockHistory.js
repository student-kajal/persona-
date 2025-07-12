import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const StockHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/products/history');
        setHistory(res.data.data || []);
      } catch (err) {
        setHistory([]);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  return (
    <div className="container py-3">
      <h2>Stock History</h2>
      <div className="card mt-3">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">Loading...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-5 text-muted">No history found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Changes</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, idx) => (
                    <tr key={idx}>
                      <td>{h.product}</td>
                      <td>{h.action}</td>
                      <td>{h.user}</td>
                      <td>
                        <pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(h.changes, null, 2)}</pre>
                      </td>
                      <td>{new Date(h.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockHistory;
