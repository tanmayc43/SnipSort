import { cn } from "@/lib/utils"

const LoadingSpinner = ({ className, size = "default", ...props }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

const LoadingOverlay = ({ children, loading, className, ...props }) => {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  )
}

const LoadingSkeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  )
}

const LoadingCard = () => {
  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <LoadingSkeleton className="h-5 w-3/4" />
          <LoadingSkeleton className="h-4 w-1/2" />
        </div>
        <LoadingSkeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-2">
        <LoadingSkeleton className="h-3 w-full" />
        <LoadingSkeleton className="h-3 w-2/3" />
      </div>
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

const LoadingGrid = ({ count = 6, className }) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  )
}

export {
  LoadingSpinner,
  LoadingOverlay,
  LoadingSkeleton,
  LoadingCard,
  LoadingGrid
}