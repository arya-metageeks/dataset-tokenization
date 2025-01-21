// components/ui/select.jsx
import React from 'react';

export const Select = ({ value, onChange, children, className = '' }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white ${className}`}
    >
      {children}
    </select>
  );
};

export const SelectItem = ({ value, children }) => {
  return (
    <option value={value}>{children}</option>
  );
};