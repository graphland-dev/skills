"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type ColumnDef as TanStackColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, RefreshCw, Search } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";

// Column definition matching the plan API
export interface ColumnDef<T = Record<string, unknown>> {
  accessor: string | ((row: T) => unknown);
  title: string;
  sortable?: boolean;
  sortKey?: string; // Use this key for sorting when accessor is a function
  searchable?: boolean; // Whether this column is searchable via global search
  Filter?: (setValue: (key: string, value: unknown) => void) => React.ReactNode;
  width?: string | number;
  cell?: (props: { row: T; value: unknown }) => React.ReactNode; // Custom cell renderer
}

export interface PaginationConfig {
  pageSize: number;
  totalItems: number;
  currentPage?: number;
}

export interface AppDataTableProps<T = Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data: T[];
  paginationConfig?: PaginationConfig;
  ActionColumn?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  onSortChange?: (column: string, direction: "asc" | "desc" | null) => void;
  sortValue?: string; // Controlled sort value as "column:direction" (e.g., from URL params)
  onFilterChange?: (column: string, value: string) => void;
  onSearchChange?: (searchTerm: string) => void; // Global search across searchable columns
  searchValue?: string; // Controlled search value (e.g., from URL params)
  onRefresh?: () => void; // Refresh button callback
  onPaginationChange?: (page: number, pageSize: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  filterButton?: React.ReactNode; // Custom filter button to render in toolbar
}

// Helper to get cell value from accessor
function getCellValue<T>(
  row: T,
  accessor: string | ((row: T) => unknown),
): unknown {
  if (typeof accessor === "function") {
    return accessor(row);
  }

  // Handle nested keys like "user.name"
  const keys = accessor.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = row as any;
  for (const key of keys) {
    value = value?.[key];
  }
  return value;
}

// Convert our ColumnDef to TanStack ColumnDef
function convertColumns<T>(
  columns: ColumnDef<T>[],
  ActionColumn?: (row: T) => React.ReactNode,
): TanStackColumnDef<T>[] {
  const tanStackColumns: TanStackColumnDef<T>[] = columns.map((col) => {
    const accessorKey =
      typeof col.accessor === "string" ? col.accessor : undefined;
    const accessorFn =
      typeof col.accessor === "function" ? col.accessor : undefined;

    return {
      id: typeof col.accessor === "string" ? col.accessor : `col_${col.title}`,
      accessorKey,
      accessorFn,
      header: ({ column }) => {
        if (col.sortable === false) {
          return <div>{col.title}</div>;
        }

        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            {col.title}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const value = getCellValue(row.original, col.accessor);
        // Use custom cell renderer if provided
        if (col.cell) {
          return col.cell({ row: row.original, value });
        }
        return (
          <div>
            {value != null
              ? typeof value === "object" && React.isValidElement(value)
                ? value
                : String(value)
              : "—"}
          </div>
        );
      },
      enableSorting: col.sortable !== false,
      size: col.width
        ? typeof col.width === "number"
          ? col.width
          : undefined
        : undefined,
      minSize: col.width
        ? typeof col.width === "number"
          ? col.width
          : undefined
        : undefined,
      maxSize: col.width
        ? typeof col.width === "number"
          ? col.width
          : undefined
        : undefined,
    } as TanStackColumnDef<T>;
  });

  // Add action column if provided
  if (ActionColumn) {
    tanStackColumns.push({
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center">{ActionColumn(row.original)}</div>
      ),
      size: 120,
      minSize: 100,
      maxSize: 150,
    } as TanStackColumnDef<T>);
  }

  return tanStackColumns;
}

export function AppDataTable<T extends Record<string, unknown>>({
  columns,
  data,
  paginationConfig,
  ActionColumn,
  onRowClick,
  onSortChange,
  sortValue,
  onFilterChange,
  onSearchChange,
  searchValue,
  onRefresh,
  onPaginationChange,
  loading = false,
  emptyMessage = "No data available",
  filterButton,
}: AppDataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [filterValues, setFilterValues] = React.useState<
    Record<string, unknown>
  >({});
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState(searchValue || "");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isUserTypingRef = React.useRef(false);
  // Sync search term with controlled value from parent (only if not currently typing)
  React.useEffect(() => {
    if (
      searchValue !== undefined &&
      searchValue !== searchTerm &&
      !isUserTypingRef.current
    ) {
      setSearchTerm(searchValue);
    }
  }, [searchValue, searchTerm]);

  // Debounced search effect - only trigger when user types, not when syncing from props
  React.useEffect(() => {
    if (!onSearchChange || !isUserTypingRef.current) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer - wait 500ms after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(searchTerm);
      isUserTypingRef.current = false;
    }, 500);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, onSearchChange]);

  // Create a map of column ID to original column for lookups
  const columnMap = React.useMemo(() => {
    const map = new Map<string, ColumnDef<T>>();
    columns.forEach((col) => {
      const id =
        typeof col.accessor === "string" ? col.accessor : `col_${col.title}`;
      map.set(id, col);
    });
    return map;
  }, [columns]);

  // Convert our columns to TanStack columns
  const tanStackColumns = React.useMemo(
    () => convertColumns(columns, ActionColumn),
    [columns, ActionColumn],
  );

  // Handle sorting changes
  React.useEffect(() => {
    if (onSortChange && sorting.length > 0) {
      const sort = sorting[0];
      const columnId = sort.id;
      // Find the original column to get sortKey if needed
      const originalCol = columnMap.get(columnId);
      const sortKey = originalCol?.sortKey || columnId;
      const direction = sort.desc ? "desc" : "asc";
      const isSameSort = `${sortKey}:${direction}` === sortValue;
      if (isSameSort) {
        return;
      }
      onSortChange(sortKey, direction);
    } else if (onSortChange && sorting.length === 0) {
      // Find the last sorted column to notify it's cleared
      // onSortChange("", null); //Note: Removed for sorting already cleared even fixed issue of navigating another page
    }
  }, [sorting, onSortChange, columnMap, sortValue]);

  // Handle filter changes
  const handleFilterChange = (columnId: string, value: unknown) => {
    const newFilters = { ...filterValues, [columnId]: value };
    if (!value || (typeof value === "string" && value.trim() === "")) {
      delete newFilters[columnId];
    }
    setFilterValues(newFilters);

    // Update TanStack filters
    const filterValue = typeof value === "string" ? value : String(value ?? "");
    setColumnFilters((prev) => {
      const newFilters = prev.filter((f) => f.id !== columnId);
      if (filterValue) {
        newFilters.push({ id: columnId, value: filterValue });
      }
      return newFilters;
    });

    // Notify parent
    if (onFilterChange) {
      const originalCol = columnMap.get(columnId);
      const filterKey = originalCol?.sortKey || columnId;
      onFilterChange(filterKey, filterValue);
    }
  };

  // Handle pagination
  const [internalPageIndex, setInternalPageIndex] = React.useState(0);
  const [internalPageSize, setInternalPageSize] = React.useState(
    paginationConfig?.pageSize || 10,
  );

  const pageIndex = paginationConfig?.currentPage
    ? paginationConfig.currentPage - 1
    : internalPageIndex;

  const pageSize = paginationConfig?.pageSize || internalPageSize;

  const table = useReactTable({
    data,
    columns: tanStackColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: paginationConfig
      ? undefined
      : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: !!paginationConfig,
    manualSorting: !!onSortChange,
    pageCount: paginationConfig
      ? Math.ceil(paginationConfig.totalItems / pageSize)
      : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  });

  // Handle pagination changes
  React.useEffect(() => {
    if (onPaginationChange) {
      // onPaginationChange(pageIndex + 1, pageSize); // Note: already function is called when page changes
    }
  }, [pageIndex, pageSize, onPaginationChange]);

  // Get filterable columns
  const filterableColumns = columns.filter((col) => col.Filter);
  const activeFilterCount = Object.keys(filterValues).length;
  // Only include columns where searchable === true (explicitly set)
  const searchableColumns = columns.filter((col) => col.searchable === true);

  // Handle user input for search (debounced - updates local state immediately)
  const handleSearchChange = (value: string) => {
    isUserTypingRef.current = true;
    setSearchTerm(value);
    // The debounced effect will call onSearchChange after 500ms
  };

  const clearAllFilters = () => {
    setFilterValues({});
    setColumnFilters([]);
    filterableColumns.forEach((col) => {
      const colId = typeof col.accessor === "string" ? col.accessor : col.title;
      if (onFilterChange) {
        onFilterChange(colId, "");
      }
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Search and Toolbar Controls */}
      <div className="flex items-center gap-2">
        {/* Search Field */}
        {onSearchChange && searchableColumns.length > 0 && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
        )}

        {/* Right side buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Custom Filter Button */}
          {filterButton}

          {/* Built-in Filter Button (only if no custom filter button and filterable columns exist) */}
          {!filterButton && filterableColumns.length > 0 && (
            <>
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Filter</span>
                    {activeFilterCount > 0 && (
                      <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Apply filters to refine your search results.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    {filterableColumns.map((col, index) => {
                      const colId =
                        typeof col.accessor === "string"
                          ? col.accessor
                          : `col_${col.title}_${index}`;
                      return col.Filter ? (
                        <div key={colId} className="space-y-2">
                          <label className="text-sm font-medium">
                            {col.title}
                          </label>
                          {col.Filter((_key: string, value: unknown) =>
                            handleFilterChange(colId, value),
                          )}
                        </div>
                      ) : null;
                    })}
                  </div>
                  {activeFilterCount > 0 && (
                    <div className="mt-2 border-t pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFilters}
                        className="w-full text-destructive hover:text-destructive"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-destructive hover:text-destructive"
                >
                  Clear Filters
                </Button>
              )}
            </>
          )}

          {/* Column Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsRefreshing(true);
                const result = onRefresh();
                // Handle both sync and async refresh functions
                const refreshPromise = Promise.resolve(result);
                refreshPromise.finally(() => {
                  // Keep spinner visible for a minimum duration for better UX
                  setTimeout(() => {
                    setIsRefreshing(false);
                  }, 300);
                });
              }}
              disabled={loading || isRefreshing}
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-4 w-4",
                  (loading || isRefreshing) && "animate-spin",
                )}
              />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isActionColumn = header.id === "actions";
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          isActionColumn &&
                            "sticky right-0 z-10 bg-card border-l shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] text-center",
                        )}
                        style={{
                          width:
                            header.getSize() !== 150
                              ? header.getSize()
                              : undefined,
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  {Array.from({ length: paginationConfig?.pageSize || 5 }).map(
                    (_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        {tanStackColumns.map((column) => {
                          const isActionColumn = column.id === "actions";
                          return (
                            <TableCell
                              key={column.id || `col-${index}`}
                              className={cn(
                                isActionColumn &&
                                  "sticky right-0 z-10 bg-card border-l shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] text-center",
                              )}
                            >
                              <Skeleton className="h-4 w-full max-w-[100px] mx-auto" />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ),
                  )}
                </>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const isSelected = row.getIsSelected();
                  return (
                    <TableRow
                      key={row.id}
                      data-state={isSelected && "selected"}
                      className={cn(onRowClick && "cursor-pointer", "group")}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isActionColumn = cell.column.id === "actions";
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              isActionColumn &&
                                "sticky right-0 z-10 border-l shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] text-center",
                              isActionColumn && isSelected && "bg-muted",
                              isActionColumn && !isSelected && "bg-card",
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tanStackColumns.length}
                    className="h-24 text-center"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {paginationConfig && (
        <div className="flex items-center justify-between px-2">
          <div className="text-muted-foreground flex-1 text-sm">
            Showing {pageIndex * pageSize + 1} to{" "}
            {Math.min((pageIndex + 1) * pageSize, paginationConfig.totalItems)}{" "}
            of {paginationConfig.totalItems} entries
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  const newPageSize = Number(value);
                  setInternalPageSize(newPageSize);
                  if (onPaginationChange) {
                    onPaginationChange(1, newPageSize);
                  }
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 30, 50, 100].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const newPage = 0;
                  setInternalPageIndex(newPage);
                  if (onPaginationChange) {
                    onPaginationChange(newPage + 1, pageSize);
                  }
                }}
                disabled={loading || pageIndex === 0}
              >
                <span className="sr-only">Go to first page</span>
                {"«"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const newPage = Math.max(0, pageIndex - 1);
                  setInternalPageIndex(newPage);
                  if (onPaginationChange) {
                    onPaginationChange(newPage + 1, pageSize);
                  }
                }}
                disabled={loading || pageIndex === 0}
              >
                <span className="sr-only">Go to previous page</span>
                {"‹"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const newPage = Math.min(
                    table.getPageCount() - 1,
                    pageIndex + 1,
                  );
                  setInternalPageIndex(newPage);
                  if (onPaginationChange) {
                    onPaginationChange(newPage + 1, pageSize);
                  }
                }}
                disabled={loading || pageIndex >= table.getPageCount() - 1}
              >
                <span className="sr-only">Go to next page</span>
                {"›"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const newPage = table.getPageCount() - 1;
                  setInternalPageIndex(newPage);
                  if (onPaginationChange) {
                    onPaginationChange(newPage + 1, pageSize);
                  }
                }}
                disabled={loading || pageIndex >= table.getPageCount() - 1}
              >
                <span className="sr-only">Go to last page</span>
                {"»"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
