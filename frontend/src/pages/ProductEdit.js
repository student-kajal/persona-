import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    article: '',
    stockType: '',
    gender: '',
    color: '',
    size: '',
    cartons: '',
    pairPerCarton: '',
    mrp: '',
    rate: '',
    packing: '',
    createdByName: '',
    properties: {}
  });
  const [loading, setLoading] = useState(true);

  // Fetch product data on mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setForm({
          ...res.data.data,
          cartons: res.data.data.cartons || '',
          pairPerCarton: res.data.data.pairPerCarton || '',
          mrp: res.data.data.mrp || '',
          rate: res.data.data.rate || ''
        });
      } catch (err) {
        toast.error('Failed to load product');
        navigate('/products');
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id, navigate]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      // Exclude history field from update payload
      const { history, ...updateData } = form;
      await api.put(`/products/${id}`, {
        ...updateData,
        cartons: Number(updateData.cartons),
        pairPerCarton: Number(updateData.pairPerCarton),
        mrp: Number(updateData.mrp),
        rate: Number(updateData.rate)
      });
      toast.success('Product updated!');
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center py-5">Loading...</div>;

  return (
    <div className="container py-3">
      <h2>Edit Product</h2>
      <form onSubmit={handleSubmit} className="card p-4 mt-3">
        <div className="row g-3">
          <div className="col-md-4">
            <label>Article</label>
            <input type="text" name="article" className="form-control"
              value={form.article} onChange={handleChange} required />
          </div>
          <div className="col-md-4">
            <label>Stock Type</label>
            <select name="stockType" className="form-select"
              value={form.stockType} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="eva">EVA</option>
              <option value="pu">PU</option>
              <option value="new">NEW</option>
            </select>
          </div>
          <div className="col-md-4">
            <label>Gender</label>
            <select name="gender" className="form-select"
              value={form.gender} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="gents">Gents</option>
              <option value="ladies">Ladies</option>
              <option value="kids_male">Kids Male</option>
              <option value="kids_female">Kids Female</option>
            </select>
          </div>
          <div className="col-md-4">
            <label>Color</label>
            <input type="text" name="color" className="form-control"
              value={form.color} onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <label>Size</label>
            <input type="text" name="size" className="form-control"
              value={form.size} onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <label>Cartons</label>
            <input type="number" name="cartons" className="form-control"
              value={form.cartons} onChange={handleChange} min="0" />
          </div>
          <div className="col-md-4">
            <label>Pair/Carton</label>
            <input type="number" name="pairPerCarton" className="form-control"
              value={form.pairPerCarton} onChange={handleChange} min="0" />
          </div>
          <div className="col-md-4">
            <label>MRP</label>
            <input type="number" name="mrp" className="form-control"
              value={form.mrp} onChange={handleChange} min="0" required />
          </div>
          <div className="col-md-4">
            <label>Rate</label>
            <input type="number" name="rate" className="form-control"
              value={form.rate} onChange={handleChange} min="0" required />
          </div>
          <div className="col-md-4">
            <label>Packing</label>
            <input type="text" name="packing" className="form-control"
              value={form.packing} onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <label>Created By</label>
            <input type="text" name="createdByName" className="form-control"
              value={form.createdByName} onChange={handleChange} required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
          {loading ? 'Saving...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductEdit;
