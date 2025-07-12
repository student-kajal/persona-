import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductListTable from '../components/products/ProductListTable';

const PuKidsFemale = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/category/pu/kids_female');
        setProducts(res.data.data || []);
      } catch (err) {
        setProducts([]);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return <ProductListTable products={products} loading={loading} title="PU Kids (Female) Products" />;
};

export default PuKidsFemale;
