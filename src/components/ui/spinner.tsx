import { Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface SpinnerProps extends React.ComponentProps<'svg'> {
  color?: string
}

function Spinner({ className, color, style, ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('my-2 size-4 animate-spin', className)}
      style={{ color: color ?? 'var(--primary)', ...style }}
      {...props}
    />
  )
}

export { Spinner }
