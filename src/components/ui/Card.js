import React from 'react';
import { cn } from '../../utils/cn';

const Card = React.forwardRef(({ 
  className, 
  children, 
  hover = false,
  glow = false,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-xl border border-amber-200/50',
        hover && 'transition-all duration-300 hover:shadow-medium hover:-translate-y-1',
        glow && 'shadow-soft',
        !glow && 'shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('px-6 py-5 border-b border-gray-100', className)} {...props}>
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-xl font-semibold text-gray-900', className)} {...props}>
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-gray-600 mt-1', className)} {...props}>
    {children}
  </p>
));

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('px-6 py-5', className)} {...props}>
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl', className)} {...props}>
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
