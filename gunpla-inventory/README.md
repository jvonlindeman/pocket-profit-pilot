# Gunpla Inventory

A personal app to track a Gunpla (Gundam plastic model) collection — search, filter,
build-progress stats, and add/edit/delete kits. Data lives in a **plain JSON file on your own
Mac** (`~/Documents/Gunpla Inventory/inventory.json`); nothing is sent to any cloud.

Built with **React + TypeScript + Vite + Tailwind + shadcn/ui** on the frontend and a tiny
**Node + Express** API (writing a JSON file) on the backend.

## Quick start (macOS)

Requires **Node.js 18+** ([nodejs.org](https://nodejs.org), LTS) — the only thing you need to
install. Everything else (the built app + server dependencies) ships ready to run.

### Double-click the app icon

Double-click **`Gunpla Inventory.app`**. It starts the local server in the background (no
Terminal window) and opens the app in a browser window. That's it — open the icon whenever you
want to use it; the data is saved to `~/Documents/Gunpla Inventory/inventory.json`.

> First time, macOS may say the app is from an unidentified developer. **Right-click**
> `Gunpla Inventory.app` → **Open** → **Open** to allow it (only needed once).

Tip: drag the app onto your Dock to keep it one click away. Want a custom icon? Double-click
the optional **`make-icon.command`** once.

### Prefer a Terminal window?

Double-click **`start.command`** instead — it runs the same server but in a visible window so
you can read its log. (You normally don't need this.)

On first run the data file is created and seeded with 361 kits from `server/seed.json`
(exported from the original Google Sheet). The header shows a green **Local file** badge while
the server is running; every change is saved straight to your JSON file.

### For development (live reload)

```bash
npm run setup     # installs the app + the local server (one time)
npm start         # Vite dev server (:8080) + API (:4787), with hot reload
npm run build     # rebuild the static app the .app/start.command serve
```

## Features

- Searchable, filterable kit table (grade, status, location, "for sale").
- Summary cards: kits, built, backlog, for sale, total spent — with a filtered subtotal.
- **Build progress** bar (built vs backlog), scoped to the current filter.
- **Stats** tab: breakdowns by grade, status, location, and source.
- Add / edit / delete kits; "Reset" restores the original seed data.

## Project layout

```
.
├── Gunpla Inventory.app/      # double-click launcher (starts server, opens app)
├── start.command             # same thing, in a visible Terminal window
├── make-icon.command         # optional: apply a custom app icon (macOS)
├── dist/                      # prebuilt app the server serves (npm run build)
├── index.html
├── vite.config.ts            # dev proxy /gunpla-api → localhost:4787
├── src/
│   ├── App.tsx               # mounts the inventory page + toaster
│   ├── components/ui/         # shadcn/ui primitives used by the app
│   └── features/gunpla-inventory/
│       ├── GunplaInventoryPage.tsx
│       ├── components/        # table, filters, stats, dialogs
│       ├── hooks/ lib/ data/ types.ts
│       └── README.md          # feature internals
└── server/                    # Node + Express JSON-file API (own package.json)
    └── README.md              # server details, API, backups
```

See [`server/README.md`](server/README.md) for the API reference and how the data file/backups
work.

## Data source

Seeded from the personal **"Gunpla Backlog Inventory"** Google Sheet (first sheet), exported
to CSV and parsed into `server/seed.json` and `src/features/gunpla-inventory/data/seedData.ts`.

## Backups

Your whole collection is the single file `~/Documents/Gunpla Inventory/inventory.json` — a
plain, readable JSON file. Copy it anywhere to back it up, or just let iCloud/Dropbox sync the
folder. Because it lives outside the app folder, updating the app never touches your data.
