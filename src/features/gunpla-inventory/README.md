# Gunpla Inventory

A self-contained feature for tracking a personal Gunpla (Gundam plastic model) collection.
Built on the existing app stack: React + TypeScript + Tailwind + shadcn/ui.

Open it at **`/gunpla`**.

## What it does

- Lists all kits in a searchable, filterable table (search by name/code/source, filter by
  grade, status, location, and "for sale").
- Summary cards: total kits, built, backlog, for-sale count, and total spent.
- Add / edit / delete kits via a dialog form.
- Persists to `localStorage` (key `gunpla-inventory:v1`). No backend required.
- "Reset" restores the original data shipped from the source sheet.

## Data source

Seeded from the personal **"Gunpla Backlog Inventory"** Google Sheet (first sheet only),
exported to CSV and parsed into `data/seedData.ts` (361 kits).

Columns mapped to `GunplaItem` (see `types.ts`):

| Sheet column                         | Field               |
| ------------------------------------ | ------------------- |
| Name                                 | `name`              |
| Third party decals or waterslides    | `thirdPartyDecals`  |
| Grade                                | `grade`             |
| Peebs or Limited                     | `peebsLimited`      |
| Location                             | `location`          |
| Quantity                             | `quantity`          |
| What I paid                          | `paid`              |
| Source                               | `source`            |
| Status                               | `status`            |
| Sell?                                | `sell`              |
| Code                                 | `code` (stable id)  |
| Delpi link                           | `delpiLink`         |
| Review                               | `review`            |

## Structure

```
gunpla-inventory/
├── GunplaInventoryPage.tsx   # page that wires everything together
├── index.ts                  # public exports
├── types.ts                  # GunplaItem + filter/stat types
├── data/seedData.ts          # generated seed (from the sheet)
├── hooks/useGunplaInventory.ts
├── lib/
│   ├── inventory.ts          # filtering, stats, helpers (pure)
│   └── storage.ts            # localStorage load/save/reset
└── components/
    ├── StatsCards.tsx
    ├── FilterBar.tsx
    ├── InventoryTable.tsx
    └── ItemFormDialog.tsx
```

## Notes

- The route is public (not wrapped in `ProtectedRoute`) so it works standalone.
- Storage is per-browser; to share data across devices, swap `lib/storage.ts` for a
  Supabase-backed implementation (a `gunpla_items` table mirrors `GunplaItem` 1:1).
