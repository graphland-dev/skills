import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { useDataGrid } from "@/components/reui/data-grid/data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, Settings2 } from "lucide-react";
import * as React from "react";

export interface DataGridToolbarProps {
  /** Controlled search value (e.g. from URL params). */
  searchValue?: string;
  /** Debounced (500ms) server-side search callback. Omit to hide the input. */
  onSearchChange?: (searchTerm: string) => void;
  searchPlaceholder?: string;
  /** Refresh callback. Omit to hide the button. Async functions show a spinner. */
  onRefresh?: () => void | Promise<void>;
  /** Custom filter button (usually opens a FilterSheet). */
  filterButton?: React.ReactNode;
  /** Show the column visibility dropdown (requires tableLayout.columnsVisibility). */
  columnsVisibility?: boolean;
  children?: React.ReactNode;
}

/**
 * Toolbar for ReUI DataGrid: debounced search, refresh, filter slot, and
 * column visibility. Must be rendered inside <DataGrid> (uses its context).
 */
export function DataGridToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  onRefresh,
  filterButton,
  columnsVisibility = true,
  children,
}: DataGridToolbarProps) {
  const { table } = useDataGrid();
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

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(searchTerm);
      isUserTypingRef.current = false;
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, onSearchChange]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {onSearchChange && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                isUserTypingRef.current = true;
                setSearchTerm(e.target.value);
              }}
              placeholder={searchPlaceholder}
              className="w-64 pl-8"
            />
          </div>
        )}
        {children}
      </div>
      <div className="flex items-center gap-2">
        {filterButton}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        )}
        {columnsVisibility && table && (
          <DataGridColumnVisibility
            table={table}
            trigger={
              <Button variant="outline" size="sm">
                <Settings2 className="mr-2 h-4 w-4" />
                Columns
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
