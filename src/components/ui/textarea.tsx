import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-md border border-border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-text3 focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red aria-invalid:ring-red/20 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
