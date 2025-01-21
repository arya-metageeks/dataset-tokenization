// ui/label.jsx
import React from 'react';
import './label.css';

export const Label = ({ 
  children, 
  htmlFor, 
  className = '',
  required = false,
  disabled = false,
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`custom-label ${disabled ? 'disabled' : ''} ${className}`}
    >
      {children}
      {required && <span className="required-asterisk">*</span>}
    </label>
  );
};