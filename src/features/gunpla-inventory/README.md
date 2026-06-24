# Gunpla Inventory

A self-contained feature for tracking a personal Gunpla (Gundam plastic model) collection.
Built on the existing app stack: React + TypeScript + Tailwind + shadcn/ui.

Open it at **`/gunpla`**.

## What it does

- Lists all kits in a searchable, filterable table (search by name/code/source, filter by
  grade, status, location, and "for sale").
- Summary cards: total kits, built, backlog, for-sale count, and total spent.
- **Stats tab**: breakdowns by grade, status, location, and source (count + spend, with
  mini-bars and a built/backlog split). All breakdowns respect the active filters.
- Add / edit / delete kits via a dialog form.
- "Reset" restores the original data shipped from the source sheet.

## Storage: local SQLite database

Data lives in a **local SQLite database on your machine**, served by a tiny Node API in
[`/server`](../../../server). See [`server/README.md`](../../../server/README.md) to start it.

- **Server running** → the SQLite file (`server/data/gunpla.db`) is the source of truth.
  The header shows a green **Local DB** badge. A `localStorage` copy is kept as an offline
  mirror.
- **Server not running** → the page falls back to browser storage (`localStorage`, key
  `gunpla-inventory:v1`) so it still works; the header shows **Browser only** and a hint to
  start the server.

The frontend talks to the API through the Vite dev proxy (`/gunpla-api` →
`http://localhost:4787`). Override the base URL with `VITE_GUNPLA_API` if needed.

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
├── hooks/useGunplaInventory.ts  # SQLite API w/ localStorage fallback
├── lib/
│   ├── inventory.ts          # filtering, stats, helpers (pure)
│   ├── api.ts                # local SQLite server client
│   └── storage.ts            # localStorage offline cache
└── components/
    ├── StatsCards.tsx
    ├── FilterBar.tsx
    ├── InventoryTable.tsx
    └── ItemFormDialog.tsx
```

## Notes

- The route is public (not wrapped in `ProtectedRoute`) so it works standalone.
- The SQLite DB stays on your machine — nothing is sent to any cloud service.
