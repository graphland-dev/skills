// Canonical list page wired for TanStack Router. The pattern is router-agnostic:
// pagination/sort/search/filter state lives in URL search params, and the router
// hooks below are the only thing to swap for Next.js or React Router (see
// references/adaptation.md). The table is GraphLand's <DataTable> — pages never
// import ReUI or @tanstack/react-table directly.
import { DataTable, type ColumnDef } from "@/components/table/data-table";
import {
  MatchOperator,
  buildPaginationParams,
} from "@/components/table/table-utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useConfirmation } from "@/hooks/use-confirm";
import { gqlClient } from "@/lib/gql-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Edit, Filter, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { EntityFilterSheet } from "./~components/entity-filter-sheet";
import { EntityFormSheet } from "./~components/entity-form-sheet";
import {
  CREATE_ENTITY_MUTATION,
  DELETE_ENTITY_MUTATION,
  ENTITY_LIST_QUERY,
  UPDATE_ENTITY_MUTATION,
  type EntitiesWithPagination,
  type Entity,
} from "./~util";

export const Route = createFileRoute("/entities/")({
  component: EntitiesPage,
  validateSearch: z.object({
    sort: z.string().optional(),
    search: z.string().optional(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
    filterEntity: z.string().optional(),
  }),
});

function EntitiesPage() {
  const sp = useSearch({ from: "/entities/" });
  const navigate = useNavigate({ from: "/entities" });
  const queryClient = useQueryClient();
  const { trigger: confirm } = useConfirmation();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

  const searchableColumns = useMemo(() => ["name"], []);

  const paginationParams = useMemo(() => {
    const base = buildPaginationParams(sp, searchableColumns);
    const filters = [...(base.filters ?? [])];

    if (sp.filterEntity) {
      filters.push({
        key: "_id",
        operator: MatchOperator.Eq,
        value: sp.filterEntity,
      });
    }

    return { ...base, ...(filters.length > 0 && { filters }) };
  }, [sp, searchableColumns]);

  const entitiesQuery = useQuery({
    queryKey: ["entities", paginationParams],
    queryFn: () =>
      gqlClient.request<{ namespace__entities: EntitiesWithPagination }>(
        ENTITY_LIST_QUERY,
        { where: paginationParams },
      ),
  });

  const allEntitiesQuery = useQuery({
    queryKey: ["entities", "all"],
    queryFn: () =>
      gqlClient.request<{ namespace__entities: EntitiesWithPagination }>(
        ENTITY_LIST_QUERY,
        { where: { page: 1, limit: 1000 } },
      ),
  });

  const createMutation = useMutation({
    mutationFn: (input: { name: string }) =>
      gqlClient.request(CREATE_ENTITY_MUTATION, { body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      setIsSheetOpen(false);
      setEditingEntity(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: { name: string }) => {
      if (!editingEntity?._id)
        throw new Error("Entity ID is required for update");
      return gqlClient.request(UPDATE_ENTITY_MUTATION, {
        where: {
          key: "_id",
          operator: MatchOperator.Eq,
          value: editingEntity._id,
        },
        body: input,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      setIsSheetOpen(false);
      setEditingEntity(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      gqlClient.request(DELETE_ENTITY_MUTATION, {
        where: { key: "_id", operator: MatchOperator.Eq, value: id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });

  const handleDelete = (entity: Entity) => {
    confirm({
      title: "Delete Entity",
      description: `Are you sure you want to delete "${entity.name}"? This action cannot be undone.`,
      onConfirm: () => deleteMutation.mutate(entity._id),
    });
  };

  // GraphLand column defs — `sortKey`/accessor map to the backend sort field.
  const columns = useMemo<ColumnDef<Entity>[]>(
    () => [
      {
        accessor: "name",
        title: "Name",
        sortable: true,
        cell: ({ row }) => (
          <span className="font-medium">{row.name}</span>
        ),
      },
    ],
    [],
  );

  const meta = entitiesQuery.data?.namespace__entities?.meta;

  const activeFilterCount = useMemo(
    () => (sp.filterEntity ? 1 : 0),
    [sp.filterEntity],
  );

  const handleFilterChange = (filters: { filterEntity?: string }) => {
    navigate({ search: { ...sp, ...filters, page: 1 }, replace: true });
  };

  return (
    <div className="space-y-4 p-4">
      <PageHeader
        title="Entities"
        subtitle="Manage your entities"
        Action={
          <Button
            onClick={() => {
              setEditingEntity(null);
              setIsSheetOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Create Entity
          </Button>
        }
      />

      <EntityFilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        entities={allEntitiesQuery.data?.namespace__entities?.nodes ?? []}
        filterEntity={sp.filterEntity}
        onFilterChange={handleFilterChange}
      />

      <EntityFormSheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setEditingEntity(null);
        }}
        entity={editingEntity}
        onSubmit={async (values) => {
          const input = { name: values.name };
          if (editingEntity) {
            await updateMutation.mutateAsync(input);
          } else {
            await createMutation.mutateAsync(input);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
        error={
          createMutation.error || updateMutation.error
            ? String(createMutation.error ?? updateMutation.error)
            : null
        }
      />

      <DataTable
        columns={columns}
        data={entitiesQuery.data?.namespace__entities?.nodes ?? []}
        getRowId={(row) => row._id}
        loading={entitiesQuery.isLoading || deleteMutation.isPending}
        totalCount={meta?.totalCount ?? 0}
        totalPages={meta?.totalPages ?? 0}
        page={sp.page ?? 1}
        pageSize={sp.pageSize ?? 10}
        onPaginationChange={(page, pageSize) =>
          navigate({ search: { ...sp, page, pageSize }, replace: true })
        }
        sort={sp.sort}
        onSortChange={(sort) =>
          navigate({ search: { ...sp, sort, page: 1 }, replace: true })
        }
        searchValue={sp.search}
        onSearchChange={(term) =>
          navigate({
            search: { ...sp, search: term || undefined, page: 1 },
            replace: true,
          })
        }
        searchPlaceholder="Search entities..."
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["entities"] })
        }
        emptyMessage="No entities found. Try adjusting your search."
        filterButton={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterSheetOpen(true)}
            className="relative"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        }
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setEditingEntity(row);
                setIsSheetOpen(true);
              }}
            >
              <Edit className="mr-1 h-3 w-3" /> Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
            >
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
          </div>
        )}
      />
    </div>
  );
}
