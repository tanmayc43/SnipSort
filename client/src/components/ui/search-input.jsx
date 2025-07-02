import * as React from "react"
import { cn } from "@/lib/utils"
import { Search, X, Loader2 } from "lucide-react"
import { Button } from "./button"

const SearchInput = React.forwardRef(({
  className,
  onSearch,
  onClear,
  loading = false,
  debounceMs = 300,
  placeholder = "Search...",
  showClearButton = true,
  ...props
}, ref) => {
  const [value, setValue] = React.useState(props.value || "")
  const [isFocused, setIsFocused] = React.useState(false)
  const timeoutRef = React.useRef(null)

  // Debounced search
  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onSearch?.(value)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, debounceMs, onSearch])

  const handleClear = () => {
    setValue("")
    onClear?.()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear()
    }
    props.onKeyDown?.(e)
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </div>
      
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-10 py-1 text-base shadow-xs transition-all outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          isFocused && "ring-2 ring-ring/50",
          className
        )}
        {...props}
      />

      {showClearButton && value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 hover:bg-transparent"
          onClick={handleClear}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
})

SearchInput.displayName = "SearchInput"

export { SearchInput }