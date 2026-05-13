import React from 'react';
import OptimizedProductTable from '../components/products/OptimizedProductTable';

// Old ProductListTable is kept intact for other pages that may still use it.
// This page now uses the server-side paginated + virtualised table.
const Products = () => {
  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <OptimizedProductTable title="All Stock" />
    </div>
  );
};

export default Products;
