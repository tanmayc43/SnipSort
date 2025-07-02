import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { Button } from "./button"
import { AlertTriangle, Trash2, Info, CheckCircle } from "lucide-react"

const ConfirmationDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
  ...props
}) => {
  const icons = {
    default: Info,
    destructive: AlertTriangle,
    warning: AlertTriangle,
    success: CheckCircle
  }

  const Icon = icons[variant] || icons.default

  const handleConfirm = async () => {
    try {
      await onConfirm?.()
      onOpenChange?.(false)
    } catch (error) {
      // Error handling should be done by the parent component
      console.error('Confirmation action failed:', error)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-full
              ${variant === 'destructive' ? 'bg-destructive/10 text-destructive' : ''}
              ${variant === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' : ''}
              ${variant === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : ''}
              ${variant === 'default' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : ''}
            `}>
              <Icon className="h-5 w-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-left">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <DialogFooter className="flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmationDialog }