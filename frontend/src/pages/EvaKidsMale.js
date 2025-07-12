import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductListTable from '../components/products/ProductListTable';
import { toast } from 'react-toastify';

const EvaKidsMale = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/category/eva/kids_male');
        setProducts(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load EVA Kids (Male) products');
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
      title="EVA Kids (Male) Products" 
    />
  );
};

export default EvaKidsMale;
