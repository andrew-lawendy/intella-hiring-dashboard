import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ============================================================================
// NavTabs Context
// ============================================================================

interface NavTabsContextValue {
  value?: string
  onValueChange?: (value: string) => void
  variant: 'default' | 'pill' | 'underline' | 'contained'
  size: 'sm' | 'default' | 'lg'
  orientation: 'horizontal' | 'vertical'
  isActive?: (value: string) => boolean
}

const NavTabsContext = React.createContext<NavTabsContextValue>({
  variant: 'default',
  size: 'default',
  orientation: 'horizontal',
})

// ============================================================================
// NavTabs Root
// ============================================================================

const navTabsVariants = cva('flex', {
  variants: {
    orientation: {
      horizontal: 'flex-row items-center',
      vertical: 'flex-col items-stretch',
    },
    variant: {
      default: 'gap-1',
      pill: 'gap-1',
      contained: 'gap-1 bg-muted rounded-2xl py-1 px-2',
      underline: 'gap-0 border-b border-border',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
  },
})

export interface NavTabsProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof navTabsVariants> {
  /**
   * The controlled value of the active tab
   */
  value?: string
  /**
   * The default value of the active tab (uncontrolled)
   */
  defaultValue?: string
  /**
   * Callback when the active tab changes
   */
  onValueChange?: (value: string) => void
  /**
   * Size of the tabs
   */
  size?: 'sm' | 'default' | 'lg'
  /**
   * Accessible label for the tab list
   */
  'aria-label': string

  /** Function to determine if a tab is active */
  isActive?: (value: string) => boolean
}

function NavTabs({
  className,
  children,
  value: controlledValue,
  defaultValue,
  onValueChange,
  variant = 'default',
  size = 'default',
  orientation = 'horizontal',
  isActive,
  ...props
}: NavTabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [isControlled, onValueChange],
  )

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const tabs = Array.from(
        event.currentTarget.querySelectorAll('[role="tab"]:not([disabled])'),
      ) as HTMLElement[]

      const currentIndex = tabs.findIndex((tab) => tab.getAttribute('data-value') === value) ?? -1
      const activeTabIndex =
        currentIndex >= 0
          ? currentIndex
          : tabs.findIndex(
              (tab) => tab.getAttribute('aria-selected') === 'true' || tab.tabIndex === 0,
            )

      let nextIndex: number | null = null

      const isHorizontal = orientation === 'horizontal'
      const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'
      const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'

      switch (event.key) {
        case prevKey:
          event.preventDefault()
          nextIndex = activeTabIndex > 0 ? activeTabIndex - 1 : tabs.length - 1
          break
        case nextKey:
          event.preventDefault()
          nextIndex = activeTabIndex < tabs.length - 1 ? activeTabIndex + 1 : 0
          break
        case 'Home':
          event.preventDefault()
          nextIndex = 0
          break
        case 'End':
          event.preventDefault()
          nextIndex = tabs.length - 1
          break
      }

      if (nextIndex !== null && tabs[nextIndex]) {
        const nextValue = tabs[nextIndex].getAttribute('data-value')
        if (nextValue) {
          handleValueChange(nextValue)
          tabs[nextIndex].focus()
        }
      }
    },
    [value, orientation, handleValueChange],
  )

  return (
    <NavTabsContext.Provider
      value={{
        value,
        isActive,
        onValueChange: handleValueChange,
        variant: variant!,
        size: size!,
        orientation: orientation!,
      }}
    >
      <div
        role="tablist"
        tabIndex={-1}
        aria-orientation={orientation ?? undefined}
        className={cn(navTabsVariants({ variant, orientation }), className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    </NavTabsContext.Provider>
  )
}

// ============================================================================
// NavTab Item
// ============================================================================

const navTabVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium',
    'transition-all duration-200',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer select-none',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ].join(' '),
  {
    variants: {
      variant: {
        // Default: Subtle hover, no background
        default: [
          'rounded-md text-muted-foreground',
          'hover:text-foreground hover:bg-muted',
          'data-[state=active]:text-foreground data-[state=active]:bg-muted',
        ].join(' '),
        // Pill: Filled background on active (like Zila "Accounts" tab)
        pill: [
          'rounded-full text-muted-foreground',
          'hover:text-foreground hover:bg-muted',
          'bg-white shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
          'data-[state=active]:shadow-sm',
        ].join(' '),
        // Contained: Like Pill but with a border and different active state
        contained: [
          'text-foreground rounded-2xl',
          'hover:bg-white',
          'data-[state=active]:text-primary data-[state=active]:bg-white',
        ].join(' '),
        // Underline: Bottom border indicator
        underline: [
          'text-muted-foreground border-b-2 border-transparent -mb-px',
          'hover:text-foreground',
          'data-[state=active]:text-foreground data-[state=active]:border-primary',
        ].join(' '),
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-9 px-4 text-sm',
        lg: 'h-11 px-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface NavTabProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof navTabVariants> {
  /**
   * Unique value for this tab
   */
  value: string
  /**
   * Icon to display on the left side
   */
  leftIcon?: React.ReactNode
  /**
   * Icon to display on the right side
   */
  rightIcon?: React.ReactNode
  /**
   * Badge or count to display
   */
  badge?: React.ReactNode
}

function NavTab({
  className,
  children,
  value,
  leftIcon,
  rightIcon,
  badge,
  disabled,
  onClick,
  ...props
}: NavTabProps) {
  const context = React.useContext(NavTabsContext)
  const isActive = context.isActive ? context.isActive(value) : context.value === value

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      context.onValueChange?.(value)
    }
    onClick?.(event)
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      data-state={isActive ? 'active' : 'inactive'}
      data-value={value}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      className={cn(
        navTabVariants({
          variant: context.variant,
          size: context.size,
        }),
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
      {children}
      {badge && <span>{badge}</span>}
      {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </button>
  )
}

// ============================================================================
// NavTabLink - For router integration
// ============================================================================

export interface NavTabLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>, VariantProps<typeof navTabVariants> {
  /**
   * Unique value for this tab
   */
  value: string
  /**
   * Icon to display on the left side
   */
  leftIcon?: React.ReactNode
  /**
   * Icon to display on the right side
   */
  rightIcon?: React.ReactNode
  /**
   * Badge or count to display
   */
  badge?: React.ReactNode
  /**
   * Whether the link is disabled
   */
  disabled?: boolean
}

function NavTabLink({
  className,
  children,
  value,
  leftIcon,
  rightIcon,
  badge,
  disabled,
  onClick,
  ...props
}: NavTabLinkProps) {
  const context = React.useContext(NavTabsContext)
  const isActive = context.isActive ? context.isActive(value) : context.value === value

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault()
      return
    }
    context.onValueChange?.(value)
    onClick?.(event)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (disabled) {
        event.preventDefault()
        return
      }
      context.onValueChange?.(value)
    }
  }

  return (
    <a
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      data-state={isActive ? 'active' : 'inactive'}
      data-value={value}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        navTabVariants({
          variant: context.variant,
          size: context.size,
        }),
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
      {children}
      {badge && <span>{badge}</span>}
      {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </a>
  )
}

NavTabs.displayName = 'NavTabs'
NavTab.displayName = 'NavTab'
NavTabLink.displayName = 'NavTabLink'

export { NavTabs, NavTab, NavTabLink, navTabVariants }
