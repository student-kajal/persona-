import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductListTable from '../components/products/ProductListTable';

const PuLadies = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/category/pu/ladies');
        setProducts(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return <ProductListTable products={products} loading={loading} title="PU Ladies Products" />;
};

export default PuLadies;
