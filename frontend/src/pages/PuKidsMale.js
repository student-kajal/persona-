import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductListTable from '../components/products/ProductListTable';
import { toast } from 'react-toastify';

const PuKidsMale = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/category/pu/kids_male');
        setProducts(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load PU Kids Male products');
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
      title="PU Kids (Male) Products" 
    />
  );
};

export default PuKidsMale; // Correct component name (PascalCase)
