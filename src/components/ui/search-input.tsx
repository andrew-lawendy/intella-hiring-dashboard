import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Search, X, Loader2 } from 'lucide-react'

const searchInputVariants = cva('relative inline-flex w-full items-center', {
  variants: {
    variant: {
      default: '[&_input]:border-input [&_input]:bg-transparent',
      filled: '[&_input]:bg-muted [&_input]:border-transparent [&_input]:hover:bg-muted/80',
      ghost: '[&_input]:bg-transparent [&_input]:border-transparent [&_input]:hover:bg-muted',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const searchInputSize = cva('', {
  variants: {
    size: {
      sm: '[&_input]:h-8 [&_svg]:size-3.5',
      default: '[&_input]:h-9 [&_svg]:size-4',
      lg: '[&_input]:h-11 [&_svg]:size-5',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

export interface SearchInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    VariantProps<typeof searchInputVariants>,
    VariantProps<typeof searchInputSize> {
  /**
   * Show/hide the clear button when input has value
   * @default true
   */
  clearable?: boolean

  /**
   * Show a loading spinner instead of search icon
   * @default false
   */
  loading?: boolean

  /**
   * Custom leading icon to replace search icon
   */
  leadingIcon?: React.ReactNode

  /**
   * Custom trailing icon (shown when not clearable and no loading)
   */
  trailingIcon?: React.ReactNode

  /**
   * Text to show before input (prefix)
   */
  prefix?: string

  /**
   * Text to show after input (suffix)
   */
  suffix?: string

  /**
   * Error message to display below input
   */
  errorMessage?: string

  /**
   * Callback when clear button is clicked
   */
  onClear?: () => void

  /**
   * Callback when Escape key is pressed (after clearing)
   */
  onEscape?: () => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      clearable = true,
      loading = false,
      leadingIcon,
      trailingIcon,
      prefix,
      suffix,
      errorMessage,
      value,
      defaultValue,
      onChange,
      onClear,
      onEscape,
      disabled,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? '')
    const inputRef = React.useRef<HTMLInputElement>(null)
    const errorId = React.useId()

    // If value is provided, use controlled mode; otherwise use uncontrolled
    const isControlled = value !== undefined
    const displayValue = isControlled ? value : internalValue
    const hasValue = String(displayValue).length > 0

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    const handleClear = () => {
      if (!isControlled) {
        setInternalValue('')
      }
      onClear?.()
      inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        if (hasValue && clearable) {
          e.preventDefault()
          handleClear()
        }
        onEscape?.()
      }
      props.onKeyDown?.(e)
    }

    const effectiveAriaInvalid = errorMessage ? true : ariaInvalid
    const effectiveAriaDescribedBy = errorMessage
      ? `${errorId} ${ariaDescribedBy || ''}`.trim()
      : ariaDescribedBy

    const latestRef = React.useRef(ref)
    React.useLayoutEffect(() => {
      latestRef.current = ref
    })
    const mergedRef = React.useCallback((el: HTMLInputElement | null) => {
      inputRef.current = el
      const current = latestRef.current
      if (typeof current === 'function') {
        current(el)
      } else if (current) {
        current.current = el
      }
    }, [])

    return (
      <div className="w-full space-y-1.5">
        <div className={cn(searchInputVariants({ variant }), searchInputSize({ size }), className)}>
          {/* Prefix */}
          {prefix && <span className="text-muted-foreground mx-2 text-sm">{prefix}</span>}

          {/* Leading Icon Container */}
          <div className="text-muted-foreground absolute start-0 top-1/2 ms-2 -translate-y-1/2">
            {loading ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : leadingIcon ? (
              <span aria-hidden="true">{leadingIcon}</span>
            ) : (
              <Search aria-hidden="true" />
            )}
          </div>

          {/* Input */}
          <input
            ref={mergedRef}
            type="search"
            aria-label="Search"
            data-slot="search-input"
            {...(isControlled ? { value: displayValue } : { defaultValue: displayValue })}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            aria-invalid={effectiveAriaInvalid}
            aria-describedby={effectiveAriaDescribedBy}
            className={cn(
              'w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none',
              'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
              'ps-8', // Space for leading icon
              (clearable && hasValue) || trailingIcon || suffix ? 'pe-8' : '', // Space for trailing icon/clear
            )}
            {...props}
          />

          {/* Trailing Area (Clear Button or Custom Icon) */}
          {(clearable || trailingIcon || suffix) && (
            <div className="absolute end-0 top-1/2 me-2 flex -translate-y-1/2 items-center gap-1">
              {clearable && hasValue && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center rounded-md p-0.5 transition-colors disabled:opacity-50"
                  disabled={disabled}
                  aria-label="Clear search"
                >
                  <X aria-hidden="true" />
                </button>
              )}
              {!clearable && trailingIcon && (
                <span className="text-muted-foreground" aria-hidden="true">
                  {trailingIcon}
                </span>
              )}
            </div>
          )}

          {/* Suffix */}
          {suffix && <span className="text-muted-foreground mx-2 text-sm">{suffix}</span>}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div id={errorId} className="text-destructive text-sm" role="alert">
            {errorMessage}
          </div>
        )}
      </div>
    )
  },
)

SearchInput.displayName = 'SearchInput'

export { SearchInput }
