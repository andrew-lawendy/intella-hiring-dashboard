import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

// Stats Card container variants
const statsCardVariants = cva('flex flex-col rounded-xl border transition-colors', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground',
      filled: 'bg-muted/50 text-card-foreground border-transparent',
    },
    size: {
      sm: 'p-4 gap-2',
      default: 'p-6 gap-3',
      lg: 'p-8 gap-4',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

// Trend indicator variants
const trendVariants = cva('inline-flex items-center gap-1 text-xs font-medium', {
  variants: {
    trend: {
      positive: 'text-success',
      negative: 'text-destructive',
      neutral: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    trend: 'neutral',
  },
})

// Icon container variants
const iconContainerVariants = cva('flex items-center justify-center rounded-lg shrink-0', {
  variants: {
    size: {
      sm: 'size-8 [&>svg]:size-4',
      default: 'size-10 [&>svg]:size-5',
      lg: 'size-12 [&>svg]:size-6',
    },
    iconVariant: {
      default: 'bg-muted text-muted-foreground',
      primary: 'bg-primary/10 text-primary',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      destructive: 'bg-destructive/10 text-destructive',
    },
  },
  defaultVariants: {
    size: 'default',
    iconVariant: 'default',
  },
})

// Value text size based on card size
const valueVariants = cva('font-bold tracking-tight', {
  variants: {
    size: {
      sm: 'text-2xl',
      default: 'text-3xl',
      lg: 'text-4xl',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

// Title text size based on card size
const titleVariants = cva('font-medium text-muted-foreground', {
  variants: {
    size: {
      sm: 'text-xs',
      default: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

type TrendDirection = 'up' | 'down' | 'neutral' | undefined

function getTrendVariant(direction: TrendDirection): 'positive' | 'negative' | 'neutral' {
  if (direction === 'up') return 'positive'
  if (direction === 'down') return 'negative'
  return 'neutral'
}

function formatTrendValue(trendValue: number | undefined | null): string | null {
  if (trendValue === undefined || trendValue === null) return null
  const absValue = Math.abs(trendValue)
  const prefix = trendValue > 0 ? '+' : trendValue < 0 ? '-' : ''
  return `${prefix}${absValue}%`
}

function renderTrendIcon(direction: TrendDirection): React.ReactNode {
  if (direction === 'up') return <TrendingUp className="size-3" aria-hidden="true" />
  if (direction === 'down') return <TrendingDown className="size-3" aria-hidden="true" />
  return <Minus className="size-3" aria-hidden="true" />
}

function getTrendAriaLabel(
  trendValue: number | undefined | null,
  direction: TrendDirection,
): string {
  if (trendValue === undefined || trendValue === null) return ''
  const absValue = Math.abs(trendValue)
  if (direction === 'up') return `increased by ${absValue} percent`
  if (direction === 'down') return `decreased by ${absValue} percent`
  return 'unchanged'
}

export interface StatsCardProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof statsCardVariants> {
  /** Card title/label */
  title: React.ReactNode
  /** Main metric value */
  value: React.ReactNode
  /** Icon to display */
  icon?: React.ReactNode
  /** Icon color variant */
  iconVariant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'
  /** Trend percentage (e.g., 12 for +12%) */
  trendValue?: number
  /** Override automatic trend direction */
  trendDirection?: 'up' | 'down' | 'neutral'
  /** Description text (e.g., "from last month") */
  description?: string
  /** Loading state */
  loading?: boolean
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      className,
      variant,
      size,
      title,
      value,
      icon,
      iconVariant = 'default',
      trendValue,
      trendDirection,
      description,
      loading = false,
      ...props
    },
    ref,
  ) => {
    // Determine trend direction from value if not explicitly set
    const effectiveTrendDirection = React.useMemo(() => {
      if (trendDirection) return trendDirection
      if (trendValue === undefined || trendValue === null) return undefined
      if (trendValue > 0) return 'up'
      if (trendValue < 0) return 'down'
      return 'neutral'
    }, [trendValue, trendDirection])

    if (loading) {
      return (
        <div
          ref={ref}
          role="status"
          className={cn(statsCardVariants({ variant, size }), className)}
          aria-busy="true"
          aria-label="Loading statistics"
          {...props}
        >
          <div className="flex items-center gap-3">
            <Skeleton
              className={cn(
                'rounded-lg',
                size === 'sm' ? 'size-8' : size === 'lg' ? 'size-12' : 'size-10',
              )}
            />
            <Skeleton
              className={cn('h-4', size === 'sm' ? 'w-20' : size === 'lg' ? 'w-32' : 'w-24')}
            />
          </div>
          <Skeleton
            className={cn(size === 'sm' ? 'h-8 w-16' : size === 'lg' ? 'h-12 w-24' : 'h-10 w-20')}
          />
          <Skeleton className="h-4 w-32" />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        data-slot="stats-card"
        className={cn(statsCardVariants({ variant, size }), className)}
        {...props}
      >
        {/* Header with icon and title */}
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn(iconContainerVariants({ size, iconVariant }))} aria-hidden="true">
              {icon}
            </div>
          )}
          <span className={cn(titleVariants({ size }))}>{title}</span>
        </div>

        {/* Value */}
        <div className={cn(valueVariants({ size }))}>{value}</div>

        {/* Trend and description */}
        {(trendValue !== undefined || description) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {trendValue !== undefined && (
              <span
                className={cn(
                  trendVariants({
                    trend: getTrendVariant(effectiveTrendDirection),
                  }),
                )}
                aria-label={getTrendAriaLabel(trendValue, effectiveTrendDirection)}
              >
                {renderTrendIcon(effectiveTrendDirection)}
                <span>{formatTrendValue(trendValue)}</span>
              </span>
            )}
            {description && <span className="text-muted-foreground text-xs">{description}</span>}
          </div>
        )}
      </div>
    )
  },
)
StatsCard.displayName = 'StatsCard'

// Skeleton loader for Stats Card
const StatsCardSkeleton = React.forwardRef<
  HTMLDivElement,
  Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> &
    Pick<VariantProps<typeof statsCardVariants>, 'variant' | 'size'>
>(({ className, variant, size, ...props }, ref) => {
  return (
    <StatsCard
      ref={ref}
      className={className}
      variant={variant}
      size={size}
      title=""
      value=""
      loading
      {...props}
    />
  )
})
StatsCardSkeleton.displayName = 'StatsCardSkeleton'

export { StatsCard, StatsCardSkeleton, statsCardVariants }
