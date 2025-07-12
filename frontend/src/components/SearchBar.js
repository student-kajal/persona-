// src/components/SearchBar.js
import React from 'react';

const SearchBar = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    className="form-control mb-3"
    placeholder={placeholder || "Search by any property..."}
    value={value}
    onChange={onChange}
    style={{ maxWidth: 350 }}
  />
);

export default SearchBar;
