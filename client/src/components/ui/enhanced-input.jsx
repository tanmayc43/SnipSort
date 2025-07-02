import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "./button"

const EnhancedInput = React.forwardRef(({
  className,
  type,
  error,
  success,
  helperText,
  showPasswordToggle = false,
  leftIcon,
  rightIcon,
  onRightIconClick,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  
  const inputType = type === 'password' && showPassword ? 'text' : type
  const hasError = !!error
  const hasSuccess = !!success && !hasError

  return (
    <div className="space-y-2">
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        
        <input
          type={inputType}
          className={cn(
            "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-all outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            leftIcon && "pl-10",
            (showPasswordToggle || rightIcon) && "pr-10",
            hasError && "border-destructive focus-visible:ring-destructive/20",
            hasSuccess && "border-green-500 focus-visible:ring-green-500/20",
            !hasError && !hasSuccess && "border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            isFocused && "ring-2",
            className
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />

        {/* Right side icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {hasError && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          {hasSuccess && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          
          {showPasswordToggle && type === 'password' && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {rightIcon && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-transparent"
              onClick={onRightIconClick}
            >
              {rightIcon}
            </Button>
          )}
        </div>
      </div>

      {/* Helper text */}
      {(error || success || helperText) && (
        <div className={cn(
          "text-xs",
          hasError && "text-destructive",
          hasSuccess && "text-green-600",
          !hasError && !hasSuccess && "text-muted-foreground"
        )}>
          {error || success || helperText}
        </div>
      )}
    </div>
  )
})

EnhancedInput.displayName = "EnhancedInput"

export { EnhancedInput }