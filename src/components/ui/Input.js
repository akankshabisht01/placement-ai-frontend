import React from 'react';
import { AlertCircle, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({ 
  className, 
  type = 'text',
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  ...props 
}, ref) => {
  const hasError = !!error;
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full h-11 px-4 text-base bg-white border rounded-lg transition-all duration-200',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            leftIcon && 'pl-11',
            rightIcon && 'pr-11',
            hasError 
              ? 'border-error-500 focus:ring-error-500 focus:border-error-500' 
              : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500 hover:border-gray-400',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
        
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-error-500" size={18} />
        )}
      </div>
      
      {(error || helperText) && (
        <p className={cn(
          'mt-1.5 text-sm flex items-center gap-1',
          hasError ? 'text-error-600' : 'text-gray-600'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

const TextArea = React.forwardRef(({ 
  className, 
  label,
  error,
  helperText,
  rows = 4,
  ...props 
}, ref) => {
  const hasError = !!error;
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full px-4 py-3 text-base bg-white border rounded-lg transition-all duration-200',
          'placeholder:text-gray-400 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          hasError 
            ? 'border-error-500 focus:ring-error-500 focus:border-error-500' 
            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500 hover:border-gray-400',
          'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
      
      {(error || helperText) && (
        <p className={cn(
          'mt-1.5 text-sm',
          hasError ? 'text-error-600' : 'text-gray-600'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';

const Select = React.forwardRef(({ 
  className, 
  label,
  error,
  helperText,
  children,
  ...props 
}, ref) => {
  const hasError = !!error;
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        className={cn(
          'w-full h-11 px-4 text-base bg-white border rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          hasError 
            ? 'border-error-500 focus:ring-error-500 focus:border-error-500' 
            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500 hover:border-gray-400',
          'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      
      {(error || helperText) && (
        <p className={cn(
          'mt-1.5 text-sm',
          hasError ? 'text-error-600' : 'text-gray-600'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export { Input, TextArea, Select };
