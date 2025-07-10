import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
    
    const variantClasses = {
      default: 'border-transparent bg-blue-500 text-white hover:bg-blue-600',
      secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
      destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
      outline: 'border-gray-300 text-gray-900 hover:bg-gray-50',
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${className || ''}`;

    return (
      <div className={classes} ref={ref} {...props} />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
