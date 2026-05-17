import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary: 'bg-muted text-muted-foreground [a&]:hover:bg-muted/90',
        destructive: 'bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90',
        success: 'bg-success text-success-foreground [a&]:hover:bg-success/90',
        warning: 'bg-warning text-warning-foreground [a&]:hover:bg-warning/90',
        outline: 'border-border text-foreground [a&]:hover:bg-muted',
        'outline-success': 'border-success/40 text-success bg-success/10 [a&]:hover:bg-success/20',
        'outline-destructive':
          'border-destructive/40 text-destructive bg-destructive/10 [a&]:hover:bg-destructive/20',
        'outline-warning': 'border-warning/40 text-warning bg-warning/10 [a&]:hover:bg-warning/20',
        ghost: '[a&]:hover:bg-muted [a&]:hover:text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
    removable?: boolean
    onRemove?: () => void
  }

function Badge({
  className,
  variant = 'default',
  asChild = false,
  removable = false,
  onRemove,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), removable && 'pr-1', className)}
      {...props}
    >
      {children}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Remove"
        >
          <X className="size-2.5" />
        </button>
      )}
    </Comp>
  )
}

function StatusDot({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="status-dot"
      className={cn('inline-block size-1.5 rounded-full bg-current', className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants, StatusDot }
