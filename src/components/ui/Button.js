import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'default',
  isLoading = false,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-glow focus:ring-primary-500 active:scale-95',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 active:scale-95',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 active:scale-95',
    ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
    danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 active:scale-95',
    success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 active:scale-95',
  };
  
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    default: 'h-11 px-6 text-base',
    lg: 'h-12 px-8 text-lg',
    icon: 'h-10 w-10',
  };
  
  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" size={18} />}
      {!isLoading && leftIcon && leftIcon}
      {children}
      {!isLoading && rightIcon && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
