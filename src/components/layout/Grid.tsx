/**
 * 响应式网格布局组件
 * 提供灵活的网格系统和响应式布局
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

// 容器变体配置
const containerVariants = cva(
  ['w-full mx-auto px-4'],
  {
    variants: {
      size: {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md',
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-screen-2xl',
        full: 'max-w-full',
        none: 'max-w-none'
      },
      padding: {
        none: 'px-0',
        sm: 'px-2 sm:px-4',
        md: 'px-4 sm:px-6',
        lg: 'px-4 sm:px-6 lg:px-8',
        xl: 'px-6 sm:px-8 lg:px-12'
      }
    },
    defaultVariants: {
      size: 'xl',
      padding: 'md'
    }
  }
);

// 容器组件
export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: keyof JSX.IntrinsicElements;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, as: Comp = 'div', ...props }, ref) => {
    return (
      <Comp
        ref={ref}
        className={cn(containerVariants({ size, padding }), className)}
        {...props}
      />
    );
  }
);
Container.displayName = 'Container';

// 网格变体配置
const gridVariants = cva(
  ['grid'],
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
        7: 'grid-cols-7',
        8: 'grid-cols-8',
        9: 'grid-cols-9',
        10: 'grid-cols-10',
        11: 'grid-cols-11',
        12: 'grid-cols-12',
        none: 'grid-cols-none',
        subgrid: 'grid-cols-subgrid'
      },
      rows: {
        1: 'grid-rows-1',
        2: 'grid-rows-2',
        3: 'grid-rows-3',
        4: 'grid-rows-4',
        5: 'grid-rows-5',
        6: 'grid-rows-6',
        none: 'grid-rows-none',
        subgrid: 'grid-rows-subgrid'
      },
      gap: {
        0: 'gap-0',
        1: 'gap-1',
        2: 'gap-2',
        3: 'gap-3',
        4: 'gap-4',
        5: 'gap-5',
        6: 'gap-6',
        7: 'gap-7',
        8: 'gap-8',
        10: 'gap-10',
        12: 'gap-12',
        16: 'gap-16',
        20: 'gap-20',
        24: 'gap-24'
      }
    },
    defaultVariants: {
      cols: 1,
      gap: 4
    }
  }
);

// 网格组件
export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  as?: keyof JSX.IntrinsicElements;
  responsive?: {
    sm?: VariantProps<typeof gridVariants>['cols'];
    md?: VariantProps<typeof gridVariants>['cols'];
    lg?: VariantProps<typeof gridVariants>['cols'];
    xl?: VariantProps<typeof gridVariants>['cols'];
    '2xl'?: VariantProps<typeof gridVariants>['cols'];
  };
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, rows, gap, responsive, as: Comp = 'div', ...props }, ref) => {
    // 构建响应式类名
    const responsiveClasses = responsive ? Object.entries(responsive)
      .map(([breakpoint, colValue]) => {
        if (colValue === undefined) return '';
        const prefix = breakpoint === 'sm' ? 'sm:' : 
                     breakpoint === 'md' ? 'md:' :
                     breakpoint === 'lg' ? 'lg:' :
                     breakpoint === 'xl' ? 'xl:' :
                     breakpoint === '2xl' ? '2xl:' : '';
        return `${prefix}grid-cols-${colValue}`;
      })
      .filter(Boolean)
      .join(' ') : '';

    return (
      <Comp
        ref={ref}
        className={cn(
          gridVariants({ cols, rows, gap }),
          responsiveClasses,
          className
        )}
        {...props}
      />
    );
  }
);
Grid.displayName = 'Grid';

// 网格项变体配置
const gridItemVariants = cva(
  [],
  {
    variants: {
      colSpan: {
        1: 'col-span-1',
        2: 'col-span-2',
        3: 'col-span-3',
        4: 'col-span-4',
        5: 'col-span-5',
        6: 'col-span-6',
        7: 'col-span-7',
        8: 'col-span-8',
        9: 'col-span-9',
        10: 'col-span-10',
        11: 'col-span-11',
        12: 'col-span-12',
        full: 'col-span-full'
      },
      rowSpan: {
        1: 'row-span-1',
        2: 'row-span-2',
        3: 'row-span-3',
        4: 'row-span-4',
        5: 'row-span-5',
        6: 'row-span-6',
        full: 'row-span-full'
      },
      colStart: {
        1: 'col-start-1',
        2: 'col-start-2',
        3: 'col-start-3',
        4: 'col-start-4',
        5: 'col-start-5',
        6: 'col-start-6',
        7: 'col-start-7',
        8: 'col-start-8',
        9: 'col-start-9',
        10: 'col-start-10',
        11: 'col-start-11',
        12: 'col-start-12',
        13: 'col-start-13'
      },
      colEnd: {
        1: 'col-end-1',
        2: 'col-end-2',
        3: 'col-end-3',
        4: 'col-end-4',
        5: 'col-end-5',
        6: 'col-end-6',
        7: 'col-end-7',
        8: 'col-end-8',
        9: 'col-end-9',
        10: 'col-end-10',
        11: 'col-end-11',
        12: 'col-end-12',
        13: 'col-end-13'
      }
    }
  }
);

// 网格项组件
export interface GridItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridItemVariants> {
  as?: keyof JSX.IntrinsicElements;
  responsive?: {
    sm?: Partial<VariantProps<typeof gridItemVariants>>;
    md?: Partial<VariantProps<typeof gridItemVariants>>;
    lg?: Partial<VariantProps<typeof gridItemVariants>>;
    xl?: Partial<VariantProps<typeof gridItemVariants>>;
    '2xl'?: Partial<VariantProps<typeof gridItemVariants>>;
  };
}

const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, colSpan, rowSpan, colStart, colEnd, responsive, as: Comp = 'div', ...props }, ref) => {
    // 构建响应式类名
    const responsiveClasses = responsive ? Object.entries(responsive)
      .map(([breakpoint, values]) => {
        if (!values) return '';
        const prefix = breakpoint === 'sm' ? 'sm:' : 
                     breakpoint === 'md' ? 'md:' :
                     breakpoint === 'lg' ? 'lg:' :
                     breakpoint === 'xl' ? 'xl:' :
                     breakpoint === '2xl' ? '2xl:' : '';
        
        const classes = [];
        if (values.colSpan) classes.push(`${prefix}col-span-${values.colSpan}`);
        if (values.rowSpan) classes.push(`${prefix}row-span-${values.rowSpan}`);
        if (values.colStart) classes.push(`${prefix}col-start-${values.colStart}`);
        if (values.colEnd) classes.push(`${prefix}col-end-${values.colEnd}`);
        
        return classes.join(' ');
      })
      .filter(Boolean)
      .join(' ') : '';

    return (
      <Comp
        ref={ref}
        className={cn(
          gridItemVariants({ colSpan, rowSpan, colStart, colEnd }),
          responsiveClasses,
          className
        )}
        {...props}
      />
    );
  }
);
GridItem.displayName = 'GridItem';

// Flex布局变体配置
const flexVariants = cva(
  ['flex'],
  {
    variants: {
      direction: {
        row: 'flex-row',
        'row-reverse': 'flex-row-reverse',
        col: 'flex-col',
        'col-reverse': 'flex-col-reverse'
      },
      wrap: {
        nowrap: 'flex-nowrap',
        wrap: 'flex-wrap',
        'wrap-reverse': 'flex-wrap-reverse'
      },
      justify: {
        start: 'justify-start',
        end: 'justify-end',
        center: 'justify-center',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly'
      },
      align: {
        start: 'items-start',
        end: 'items-end',
        center: 'items-center',
        baseline: 'items-baseline',
        stretch: 'items-stretch'
      },
      gap: {
        0: 'gap-0',
        1: 'gap-1',
        2: 'gap-2',
        3: 'gap-3',
        4: 'gap-4',
        5: 'gap-5',
        6: 'gap-6',
        8: 'gap-8',
        10: 'gap-10',
        12: 'gap-12',
        16: 'gap-16'
      }
    },
    defaultVariants: {
      direction: 'row',
      wrap: 'nowrap',
      justify: 'start',
      align: 'start',
      gap: 0
    }
  }
);

// Flex组件
export interface FlexProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants> {
  as?: keyof JSX.IntrinsicElements;
  responsive?: {
    sm?: Partial<VariantProps<typeof flexVariants>>;
    md?: Partial<VariantProps<typeof flexVariants>>;
    lg?: Partial<VariantProps<typeof flexVariants>>;
    xl?: Partial<VariantProps<typeof flexVariants>>;
    '2xl'?: Partial<VariantProps<typeof flexVariants>>;
  };
}

const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ className, direction, wrap, justify, align, gap, responsive, as: Comp = 'div', ...props }, ref) => {
    // 构建响应式类名
    const responsiveClasses = responsive ? Object.entries(responsive)
      .map(([breakpoint, values]) => {
        if (!values) return '';
        const prefix = breakpoint === 'sm' ? 'sm:' : 
                     breakpoint === 'md' ? 'md:' :
                     breakpoint === 'lg' ? 'lg:' :
                     breakpoint === 'xl' ? 'xl:' :
                     breakpoint === '2xl' ? '2xl:' : '';
        
        const classes = [];
        if (values.direction) {
          const directionClass = values.direction === 'row' ? 'flex-row' :
                                values.direction === 'row-reverse' ? 'flex-row-reverse' :
                                values.direction === 'col' ? 'flex-col' :
                                values.direction === 'col-reverse' ? 'flex-col-reverse' : '';
          if (directionClass) classes.push(`${prefix}${directionClass}`);
        }
        if (values.justify) {
          const justifyClass = values.justify === 'start' ? 'justify-start' :
                              values.justify === 'end' ? 'justify-end' :
                              values.justify === 'center' ? 'justify-center' :
                              values.justify === 'between' ? 'justify-between' :
                              values.justify === 'around' ? 'justify-around' :
                              values.justify === 'evenly' ? 'justify-evenly' : '';
          if (justifyClass) classes.push(`${prefix}${justifyClass}`);
        }
        if (values.align) {
          const alignClass = values.align === 'start' ? 'items-start' :
                            values.align === 'end' ? 'items-end' :
                            values.align === 'center' ? 'items-center' :
                            values.align === 'baseline' ? 'items-baseline' :
                            values.align === 'stretch' ? 'items-stretch' : '';
          if (alignClass) classes.push(`${prefix}${alignClass}`);
        }
        if (values.gap) classes.push(`${prefix}gap-${values.gap}`);
        
        return classes.join(' ');
      })
      .filter(Boolean)
      .join(' ') : '';

    return (
      <Comp
        ref={ref}
        className={cn(
          flexVariants({ direction, wrap, justify, align, gap }),
          responsiveClasses,
          className
        )}
        {...props}
      />
    );
  }
);
Flex.displayName = 'Flex';

// Stack组件（垂直Flex的简化版本）
export interface StackProps extends Omit<FlexProps, 'direction'> {
  spacing?: VariantProps<typeof flexVariants>['gap'];
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ spacing, gap, ...props }, ref) => {
    return (
      <Flex
        ref={ref}
        direction="col"
        gap={spacing || gap}
        {...props}
      />
    );
  }
);
Stack.displayName = 'Stack';

// HStack组件（水平Flex的简化版本）
export interface HStackProps extends Omit<FlexProps, 'direction'> {
  spacing?: VariantProps<typeof flexVariants>['gap'];
}

const HStack = React.forwardRef<HTMLDivElement, HStackProps>(
  ({ spacing, gap, ...props }, ref) => {
    return (
      <Flex
        ref={ref}
        direction="row"
        gap={spacing || gap}
        {...props}
      />
    );
  }
);
HStack.displayName = 'HStack';

// 响应式工具组件
export interface ResponsiveProps {
  children: React.ReactNode;
  show?: {
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
    '2xl'?: boolean;
  };
  hide?: {
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
    '2xl'?: boolean;
  };
}

const Responsive: React.FC<ResponsiveProps> = ({ children, show, hide }) => {
  const showClasses = show ? Object.entries(show)
    .map(([breakpoint, shouldShow]) => {
      if (!shouldShow) return '';
      const prefix = breakpoint === 'sm' ? 'sm:' : 
                   breakpoint === 'md' ? 'md:' :
                   breakpoint === 'lg' ? 'lg:' :
                   breakpoint === 'xl' ? 'xl:' :
                   breakpoint === '2xl' ? '2xl:' : '';
      return `${prefix}block`;
    })
    .filter(Boolean)
    .join(' ') : '';

  const hideClasses = hide ? Object.entries(hide)
    .map(([breakpoint, shouldHide]) => {
      if (!shouldHide) return '';
      const prefix = breakpoint === 'sm' ? 'sm:' : 
                   breakpoint === 'md' ? 'md:' :
                   breakpoint === 'lg' ? 'lg:' :
                   breakpoint === 'xl' ? 'xl:' :
                   breakpoint === '2xl' ? '2xl:' : '';
      return `${prefix}hidden`;
    })
    .filter(Boolean)
    .join(' ') : '';

  const defaultClass = show ? 'hidden' : hide ? 'block' : '';

  return (
    <div className={cn(defaultClass, showClasses, hideClasses)}>
      {children}
    </div>
  );
};

// 断点工具Hook
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else setBreakpoint('sm');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2Xl: breakpoint === '2xl',
    isSmUp: ['sm', 'md', 'lg', 'xl', '2xl'].includes(breakpoint),
    isMdUp: ['md', 'lg', 'xl', '2xl'].includes(breakpoint),
    isLgUp: ['lg', 'xl', '2xl'].includes(breakpoint),
    isXlUp: ['xl', '2xl'].includes(breakpoint)
  };
};

export {
  Container,
  Grid,
  GridItem,
  Flex,
  Stack,
  HStack,
  Responsive,
  containerVariants,
  gridVariants,
  gridItemVariants,
  flexVariants
};