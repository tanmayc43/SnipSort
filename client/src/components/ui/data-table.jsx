import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { LoadingSpinner } from "./loading-spinner"
import { EmptyState } from "./empty-state"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  pagination = null,
  onPageChange,
  onPageSizeChange,
  emptyState,
  className,
  ...props
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading data</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return emptyState || (
      <EmptyState
        title="No data available"
        description="There are no items to display."
      />
    )
  }

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  className={cn(
                    "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                    column.className
                  )}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className="border-b transition-colors hover:bg-muted/50"
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key || colIndex}
                    className={cn("p-4 align-middle", column.cellClassName)}
                  >
                    {column.render ? column.render(row, rowIndex) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(1)}
              disabled={pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-1">
              <span className="text-sm">Page</span>
              <span className="text-sm font-medium">
                {pagination.page} of {pagination.totalPages}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export { DataTable }