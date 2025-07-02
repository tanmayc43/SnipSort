import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { SearchInput } from "./search-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Badge } from "./badge"
import { X, Filter, SlidersHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "./dropdown-menu"

const FilterBar = ({
  searchValue = "",
  onSearchChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  sortOptions = [],
  sortValue = "",
  onSortChange,
  className,
  children
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false)
  
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length

  const clearAllFilters = () => {
    const clearedFilters = Object.keys(activeFilters).reduce((acc, key) => {
      acc[key] = null
      return acc
    }, {})
    onFilterChange?.(clearedFilters)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main filter row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <SearchInput
            value={searchValue}
            onSearch={onSearchChange}
            placeholder="Search..."
            className="w-full"
          />
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-2">
          {/* Sort */}
          {sortOptions.length > 0 && (
            <Select value={sortValue} onValueChange={onSortChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Advanced filters toggle */}
          {filters.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filters.map((filter) => (
                  <DropdownMenuCheckboxItem
                    key={filter.key}
                    checked={!!activeFilters[filter.key]}
                    onCheckedChange={(checked) => 
                      onFilterChange?.({ ...activeFilters, [filter.key]: checked ? filter.value : null })
                    }
                  >
                    {filter.label}
                  </DropdownMenuCheckboxItem>
                ))}
                {activeFilterCount > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="w-full justify-start"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear all
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {children}
        </div>
      </div>

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null
            const filter = filters.find(f => f.key === key)
            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {filter?.label || key}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 p-0 hover:bg-transparent"
                  onClick={() => onFilterChange?.({ ...activeFilters, [key]: null })}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

export { FilterBar }