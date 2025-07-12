import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductListTable from '../components/products/ProductListTable';
import { toast } from 'react-toastify';

const EvaKidsFemale = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/category/eva/kids_female');
        setProducts(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load EVA Kids (Female) products');
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
      title="EVA Kids (Female) Products" 
    />
  );
};

export default EvaKidsFemale;
