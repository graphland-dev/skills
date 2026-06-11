import { FilterSheet, type FilterField } from "@/components/table/filter-sheet";
import { useMemo } from "react";
import type { Entity } from "../~util";

interface EntityFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entities: Entity[];
  filterEntity?: string;
  onFilterChange: (filters: { filterEntity?: string }) => void;
}

export function EntityFilterSheet({
  open,
  onOpenChange,
  entities,
  filterEntity,
  onFilterChange,
}: EntityFilterSheetProps) {
  const entityOptions = useMemo(
    () =>
      entities
        .filter((e) => e._id && e.name)
        .map((e) => ({ value: e._id, label: e.name })),
    [entities],
  );

  const handleClearAll = () => {
    onFilterChange({ filterEntity: undefined });
  };

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: "entity",
        label: "Entity Name",
        value: filterEntity,
        options: entityOptions,
        placeholder: "Filter by entity...",
        emptyMessage: "No entities found.",
        onChange: (value: string) => {
          onFilterChange({ filterEntity: value || undefined });
        },
      },
    ],
    [filterEntity, entityOptions, onFilterChange],
  );

  return (
    <FilterSheet
      open={open}
      onOpenChange={onOpenChange}
      filters={filterFields}
      onClearAll={handleClearAll}
    />
  );
}
