/**
 * 现代化Card组件
 * 支持多种变体和样式，具有完整的无障碍访问性支持
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

// 卡片变体配置
const cardVariants = cva(
  [
    'rounded-lg border bg-card text-card-foreground',
    'transition-all duration-200'
  ],
  {
    variants: {
      variant: {
        default: 'border-border shadow-sm',
        elevated: 'border-border shadow-md hover:shadow-lg',
        outlined: 'border-2 border-border shadow-none',
        ghost: 'border-transparent shadow-none bg-transparent',
        filled: 'border-border bg-muted/50 shadow-sm'
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10'
      },
      interactive: {
        true: 'cursor-pointer hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false
    }
  }
);

// Card根组件属性
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

// Card根组件
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'div' : 'div';
    
    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ variant, size, interactive }), className)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// Card头部组件
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | 'md' | 'lg';
  }
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'p-4 pb-2',
    md: 'p-6 pb-2',
    lg: 'p-8 pb-4'
  };

  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5', sizeClasses[size], className)}
      {...props}
    />
  );
});
CardHeader.displayName = 'CardHeader';

// Card标题组件
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }
>(({ className, as: Comp = 'h3', size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-semibold',
    lg: 'text-xl font-semibold',
    xl: 'text-2xl font-bold'
  };

  return (
    <Comp
      ref={ref}
      className={cn(
        'leading-none tracking-tight',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = 'CardTitle';

// Card描述组件
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    size?: 'sm' | 'md' | 'lg';
  }
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <p
      ref={ref}
      className={cn(
        'text-muted-foreground',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
CardDescription.displayName = 'CardDescription';

// Card内容组件
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | 'md' | 'lg';
  }
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'p-4 pt-0',
    md: 'p-6 pt-0',
    lg: 'p-8 pt-0'
  };

  return (
    <div
      ref={ref}
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  );
});
CardContent.displayName = 'CardContent';

// Card底部组件
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | 'md' | 'lg';
  }
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'p-4 pt-0',
    md: 'p-6 pt-0',
    lg: 'p-8 pt-0'
  };

  return (
    <div
      ref={ref}
      className={cn('flex items-center', sizeClasses[size], className)}
      {...props}
    />
  );
});
CardFooter.displayName = 'CardFooter';

// 统计卡片组件
export interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
  variant?: VariantProps<typeof cardVariants>['variant'];
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
  variant = 'default'
}) => {
  const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      case 'neutral':
        return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      case 'neutral':
        return '→';
    }
  };

  return (
    <Card variant={variant} className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle size="sm" className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
            {trend && (
              <span className={cn('flex items-center', getTrendColor(trend.direction))}>
                <span className="mr-1">{getTrendIcon(trend.direction)}</span>
                {trend.value}% {trend.label}
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 功能卡片组件
export interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: VariantProps<typeof cardVariants>['variant'];
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  action,
  className,
  variant = 'default'
}) => {
  return (
    <Card variant={variant} className={className}>
      <CardHeader>
        {icon && (
          <div className="h-8 w-8 text-primary mb-2">
            {icon}
          </div>
        )}
        <CardTitle size="md">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action && (
        <CardFooter>
          <button
            onClick={action.onClick}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {action.label} →
          </button>
        </CardFooter>
      )}
    </Card>
  );
};

// 图片卡片组件
export interface ImageCardProps {
  title: string;
  description?: string;
  image: {
    src: string;
    alt: string;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: VariantProps<typeof cardVariants>['variant'];
}

const ImageCard: React.FC<ImageCardProps> = ({
  title,
  description,
  image,
  action,
  className,
  variant = 'default'
}) => {
  return (
    <Card variant={variant} className={cn('overflow-hidden', className)}>
      <div className="aspect-video relative overflow-hidden">
        <img
          src={image.src}
          alt={image.alt}
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardHeader>
        <CardTitle size="md">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {action && (
        <CardFooter>
          <button
            onClick={action.onClick}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {action.label}
          </button>
        </CardFooter>
      )}
    </Card>
  );
};

// 加载卡片组件
export interface LoadingCardProps {
  className?: string;
  variant?: VariantProps<typeof cardVariants>['variant'];
  lines?: number;
}

const LoadingCard: React.FC<LoadingCardProps> = ({
  className,
  variant = 'default',
  lines = 3
}) => {
  return (
    <Card variant={variant} className={className}>
      <CardHeader>
        <div className="h-4 bg-muted rounded animate-pulse mb-2" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
      </CardHeader>
      <CardContent>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-3 bg-muted rounded animate-pulse mb-2',
              i === lines - 1 && 'w-1/2'
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  StatsCard,
  FeatureCard,
  ImageCard,
  LoadingCard,
  cardVariants
};