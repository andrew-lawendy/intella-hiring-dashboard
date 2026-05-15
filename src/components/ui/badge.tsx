import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/50 aria-invalid:border-red aria-invalid:ring-red/20 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-brand text-bg [a&]:hover:bg-brand/90',
        secondary: 'bg-surface2 text-text2 [a&]:hover:bg-surface2/90',
        destructive: 'bg-red text-bg focus-visible:ring-red/20 [a&]:hover:bg-red/90',
        outline: 'border-border text-text [a&]:hover:bg-surface2 [a&]:hover:text-text',
        ghost: '[a&]:hover:bg-surface2 [a&]:hover:text-text',
        link: 'text-brand underline-offset-4 [a&]:hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
