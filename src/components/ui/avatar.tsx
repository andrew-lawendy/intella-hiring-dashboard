import * as React from 'react'
import { Avatar as AvatarPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { User } from 'lucide-react'

import { cn } from '@/lib/utils'

function hashStringToColor(str: string): string {
  const colors = [
    'bg-red-100 text-red-800',
    'bg-orange-100 text-orange-800',
    'bg-amber-100 text-amber-800',
    'bg-yellow-100 text-yellow-800',
    'bg-lime-100 text-lime-800',
    'bg-green-100 text-green-800',
    'bg-emerald-100 text-emerald-800',
    'bg-teal-100 text-teal-800',
    'bg-cyan-100 text-cyan-800',
    'bg-sky-100 text-sky-800',
    'bg-blue-100 text-blue-800',
    'bg-indigo-100 text-indigo-800',
    'bg-violet-100 text-violet-800',
    'bg-purple-100 text-purple-800',
    'bg-fuchsia-100 text-fuchsia-800',
    'bg-pink-100 text-pink-800',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const avatarVariants = cva(
  'relative inline-flex shrink-0 overflow-hidden rounded-full font-semibold',
  {
    variants: {
      size: {
        xs: 'size-6 text-xs',
        sm: 'size-8 text-sm',
        md: 'size-10 text-base',
        lg: 'size-12 text-lg',
        xl: 'size-16 text-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

interface AvatarProps
  extends React.ComponentProps<typeof AvatarPrimitive.Root>, VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  ({ className, size, ...props }, ref) => (
    <AvatarPrimitive.Root
      ref={ref}
      data-slot="avatar"
      className={cn(avatarVariants({ size }), className)}
      {...props}
    />
  ),
)
Avatar.displayName = 'Avatar'

type AvatarImageProps = React.ComponentProps<typeof AvatarPrimitive.Image>

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    data-slot="avatar-image"
    className={cn('aspect-square size-full object-cover', className)}
    {...props}
  />
))
AvatarImage.displayName = 'AvatarImage'

interface AvatarFallbackProps extends React.ComponentProps<typeof AvatarPrimitive.Fallback> {
  name?: string
  icon?: boolean
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, name, icon, children, ...props }, ref) => {
  const fallbackContent = icon ? <User className="size-1/2" /> : name ? getInitials(name) : children

  const colorClass = name ? hashStringToColor(name) : 'bg-muted text-muted-foreground'

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full font-semibold',
        colorClass,
        className,
      )}
      {...props}
    >
      {fallbackContent}
    </AvatarPrimitive.Fallback>
  )
})
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback, getInitials, hashStringToColor }
