# Hooks — useConfirmation, useI18N, useIsMobile

## useConfirmation (`templates/hooks/use-confirm.tsx`)

Imperative confirm dialogs — no per-page `<AlertDialog>` plumbing. A context provider renders one shared dialog; any component triggers it.

Setup (once, at the app root):

```tsx
<ConfirmationProvider>
  <App />
</ConfirmationProvider>
```

Usage:

```tsx
const { trigger: confirm } = useConfirmation();

confirm({
  title: "Delete Product",
  description: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
  confirmText: "Delete",                 // optional
  variant: "destructive",                // "default" | "destructive" | "success"
  onConfirm: () => deleteMutation.mutate(product._id),
});
```

Convention: **every destructive action** (delete, void, cancel-order) goes through this hook. Name the entity in the description so the user knows exactly what they're confirming.

## useI18N (`templates/hooks/use-i18n.tsx`)

Translation keyed by English strings — English needs no translation file; other languages load flat JSON from `/public/locales/<lang>.json` (`{ "Create Entity": "এনটিটি তৈরি করুন" }`).

```tsx
<I18NProvider>...</I18NProvider>   // app root

const { _t, setLanguage, currentLanguage } = useI18N();
<Button>{_t("Create Entity")}</Button>
```

Convention: wrap **every user-facing string** in `_t(...)` from day one, even in English-only projects — retrofitting is the expensive part. Missing keys fall back to the English string, so partial translation files are safe.

## useIsMobile (`templates/hooks/use-mobile.ts`)

`matchMedia`-based breakpoint check (default 768px) for layout decisions that CSS can't express — e.g. rendering a master-detail split pane on desktop vs. navigation on mobile.

```tsx
const isMobile = useIsMobile();
```

Prefer Tailwind responsive classes for styling; use this hook only when the component *tree* differs by viewport.

## Adaptation

- All three hooks are plain React — no router or data-layer dependency.
- **Next.js**: all are client-side (`"use client"`); mount the providers in the root layout's client shell. For SSR-grade i18n (locale routing, server rendering), prefer `next-intl` and keep only the `_t(English string)` keying convention.
- If the project already has an i18n library, keep the convention (English strings as keys) and skip `use-i18n.tsx`.
