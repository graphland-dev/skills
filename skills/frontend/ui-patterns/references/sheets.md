# Sheets — create/edit, filter, and view panels

## Why this pattern

CRUD actions open a right-side `Sheet` (shadcn) on top of the list page instead of navigating to a separate route. The user keeps their list context (page, search, filters stay in the URL), and one form component serves both create and edit. Reserve full-page forms for complex entities (see the `new-form-page` command); reserve detail routes for entities with deep sub-resources.

## Form sheet (create + edit in one component)

The mode is decided by a single prop: `entity?: T | null`. `null`/`undefined` = create; a value = edit. See `templates/example-module/~components/entity-form-sheet.tsx` for the full implementation.

```tsx
interface EntityFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity?: Entity | null;          // null = create, value = edit
  onSubmit: (values: EntityFormValues) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}
```

Critical detail — **reset on open**, keyed to the entity:

```tsx
useEffect(() => {
  if (open) {
    form.reset(entity ? { name: entity.name ?? "" } : { name: "" });
  } else {
    form.reset();
  }
}, [open, entity, form]);
```

Without this, the sheet shows stale values when reopened or when switching between create and edit. The parent owns the state:

```tsx
const [isSheetOpen, setIsSheetOpen] = useState(false);
const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
// Create button: setEditingEntity(null); setIsSheetOpen(true);
// Edit button:   setEditingEntity(row);  setIsSheetOpen(true);
// onOpenChange:  if (!open) setEditingEntity(null);
```

The sheet stays open on error (`FormErrorAlert` shows the message); the parent closes it in the mutation's `onSuccess`.

## Filter sheet

`templates/table/filter-sheet.tsx` renders a declarative list of filter fields in a sheet, paired with the table's `filterButton` prop (which shows an active-filter count badge). Filter values live in URL params; `onChange` writes them via navigation.

```tsx
const filterFields: FilterField[] = [{
  key: "category",
  label: "Category",
  type: "combobox",            // "combobox" (default) | "text" | "date" | "number"
  value: sp.filterCategory,
  options: categoryOptions,     // { value, label }[]
  onChange: (v) => onFilterChange({ filterCategory: v || undefined }),
  // subFields: [...] for grouped ranges (e.g. date from/to)
}];

<FilterSheet open={open} onOpenChange={setOpen} filters={filterFields} onClearAll={clearAll} />
```

Wrap a per-entity `EntityFilterSheet` around it that builds the fields (see `templates/example-module/~components/entity-filter-sheet.tsx`).

## View sheet (read-only detail)

For entities needing a detail panel rather than a route: a `Sheet` with a tab strip (`useState<TabType>`), typically **Basic info** (label/value grid), **related-record tabs** (a `<DataTable>` per tab with its own local page/pageSize state), and **Documents** (uploads). An Edit button inside the view sheet opens the same form sheet. Scaffold with `/graphland:new-view-sheet`.

## Conventions

- `SheetContent side="right" className="sm:max-w-lg overflow-y-auto"` (wider, e.g. `sm:max-w-2xl`, for view sheets).
- Sheet open/close state is component state, not URL state — only *list* state belongs in the URL.
- Submit button label reflects mode and progress: `Create Entity` / `Update Entity` / `Creating...` / `Updating...`.
- Destructive actions never live in sheets directly — they go through `useConfirmation` (see [hooks.md](hooks.md)).

## Adaptation

Sheets are pure shadcn/Radix — no router or data-layer dependency. In Next.js, form sheets are client components; pass server-action-backed `onSubmit` if desired. If a design system lacks a Sheet, a Drawer/Modal works with identical props and reset-on-open logic.
