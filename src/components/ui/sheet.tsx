import * as React from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:max-w-[640px]',
            'bg-background border-l border-border shadow-xl outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out duration-300',
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          )}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function SheetClose({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      className={cn(
        'rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      aria-label="Close"
      {...props}
    >
      <XIcon className="size-4" />
    </DialogPrimitive.Close>
  )
}

export { Sheet, SheetClose }
