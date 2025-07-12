
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const DeletedProducts = () => {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/deleted');
      setProducts(res.data.data);
    } catch (err) {
      toast.error('Failed to load deleted products');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleSelect = id => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleRestore = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Restore ${selected.length} products?`)) return;
    try {
      await api.post('/products/bulk-restore', {
        ids: selected,
        updatedByName: localStorage.getItem('userName') || 'admin'
      });
      toast.success('Products restored!');
      setSelected([]);
      fetchDeleted();
    } catch (err) {
      toast.error('Restore failed');
    }
  };

  const handlePermanentDelete = async () => {
    if (selected.length === 0) {
      toast.error('Select at least one item');
      return;
    }

    const confirmed = window.confirm("Are you sure you want to permanently delete the selected products?");
    if (!confirmed) return;

    try {
      const res = await api.post('/products/permanent-delete', {
        selectedIds: selected
      });
      toast.success(res.data.message);
      setProducts(prev => prev.filter(p => !selected.includes(p._id))); // remove from UI
      setSelected([]); // clear selection
    } catch (err) {
      toast.error("Error deleting products");
      console.error(err);
    }
  };

  return (
    <div className="container py-3">
      <h2>Deleted Products</h2>

      {/* ✅ UPDATED BUTTON SECTION STARTS HERE */}
      <div className="mb-3 d-flex align-items-center">
        <button
          className="btn btn-success"
          disabled={selected.length === 0}
          onClick={handleRestore}
        >
          Restore Selected ({selected.length})
        </button>
        <button
          className="btn btn-danger ml-2"
          disabled={selected.length === 0}
          onClick={handlePermanentDelete}
        >
          Delete Selected
        </button>
      </div>
      {/* ✅ UPDATED BUTTON SECTION ENDS HERE */}

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 text-muted">No deleted products</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selected.length === products.length && products.length > 0}
                        onChange={() =>
                          setSelected(
                            selected.length === products.length
                              ? []
                              : products.map(p => p._id)
                          )
                        }
                      />
                    </th>
                    <th>Article</th>
                    <th>Stock Type</th>
                    <th>Gender</th>
                    <th>Color</th>
                    <th>Size</th>
                    <th>Cartons</th>
                    <th>Pair/Carton</th>
                    <th>MRP</th>
                    <th>Rate</th>
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id} style={{ background: "#ffe6e6" }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(p._id)}
                          onChange={() => handleSelect(p._id)}
                        />
                      </td>
                      <td>{p.article}</td>
                      <td>{p.stockType}</td>
                      <td>{p.gender}</td>
                      <td>{p.color}</td>
                      <td>{p.size}</td>
                      <td>{p.cartons}</td>
                      <td>{p.pairPerCarton}</td>
                      <td>{p.mrp}</td>
                      <td>{p.rate}</td>
                      <td>{p.createdByName || '-'}</td>
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

export default DeletedProducts;
