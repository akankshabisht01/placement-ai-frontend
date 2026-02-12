import React from 'react';
import { cn } from '../../utils/cn';

const Badge = ({ 
  className, 
  variant = 'default',
  size = 'default',
  children,
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    primary: 'bg-primary-100 text-primary-800 border-primary-200',
    secondary: 'bg-secondary-100 text-secondary-800 border-secondary-200',
    success: 'bg-success-50 text-success-700 border-success-200',
    warning: 'bg-warning-50 text-warning-700 border-warning-200',
    error: 'bg-error-50 text-error-700 border-error-200',
    outline: 'bg-transparent border-gray-300 text-gray-700',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    default: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
