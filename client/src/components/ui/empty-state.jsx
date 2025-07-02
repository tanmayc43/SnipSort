import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      {title && (
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
      )}
      
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      
      {action && (
        <div className="flex flex-col sm:flex-row gap-2">
          {action}
        </div>
      )}
      
      {children}
    </div>
  )
}

export { EmptyState }