import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductListTable from '../components/products/ProductListTable';
import { toast } from 'react-toastify';

const NewLadies = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/category/new/ladies');
        setProducts(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load NEW Ladies products');
        setProducts([]);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <ProductListTable 
      products={products} 
      loading={loading} 
      title="NEW Ladies Products" 
    />
  );
};

export default NewLadies;
