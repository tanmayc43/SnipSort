import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"
import { EnhancedInput } from "./enhanced-input"

const FormField = React.forwardRef(({
  label,
  required,
  error,
  success,
  helperText,
  className,
  children,
  ...props
}, ref) => {
  const id = props.id || props.name

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
          {label}
        </Label>
      )}
      
      {children || (
        <EnhancedInput
          ref={ref}
          error={error}
          success={success}
          helperText={helperText}
          {...props}
        />
      )}
    </div>
  )
})

FormField.displayName = "FormField"

export { FormField }