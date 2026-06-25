# Gunpla Inventory — Local JSON-file Server

A tiny Node + Express API that stores your Gunpla inventory in a **plain, human-readable JSON
file on your Mac**:

```
~/Documents/Gunpla Inventory/inventory.json
```

The file lives **outside the app folder**, so:

- updating the app never touches your data,
- you can open / read / edit / back it up like any other file,
- it syncs with iCloud / Dropbox automatically if that folder is synced.

Nothing leaves your machine. It is a separate package from the frontend (its own
`package.json`), so it does not affect the main app's build. No native modules — install is
fast and never needs Xcode.

## Requirements

- Node.js 18+ (`node --version`)

## First run

```bash
cd server
npm install        # installs express + cors (no compile step)
npm start
```

You should see:

```
🤖 Gunpla inventory API running
   → http://localhost:4787
   → Data file: /Users/you/Documents/Gunpla Inventory/inventory.json
   → Seeded from seed.json (first run)
   → 361 kits loaded
```

On the **very first run** (no data file yet) the file is created and seeded with the 361 kits
from `seed.json` (exported from the original Google Sheet). After that, your JSON file is the
source of truth and every edit is written straight to it.

## Using it with the app

In a **second terminal**, run the frontend:

```bash
npm run dev        # from the repo root
```

Open <http://localhost:8080/gunpla>. When the server is up, the page header shows a green
**Local file** badge and every add/edit/delete is written to the JSON file. If the server is
off, the page falls back to browser storage and shows **Browser only**.

The frontend reaches the API via the Vite dev proxy (`/gunpla-api` → `localhost:4787`),
configured in `vite.config.ts`.

## Scripts

| Command        | What it does                                              |
| -------------- | -------------------------------------------------------- |
| `npm start`    | Run the API server on port 4787                          |
| `npm run dev`  | Same, with `--watch` auto-restart on file changes        |
| `npm run seed` | Re-seed the data file from `seed.json` (overwrites all)  |

## Configuration (env vars)

| Variable           | Default                              | Purpose                                    |
| ------------------ | ------------------------------------ | ------------------------------------------ |
| `GUNPLA_PORT`      | `4787`                               | Port the API listens on                    |
| `GUNPLA_DATA_DIR`  | `~/Documents/Gunpla Inventory`       | Folder for the data file                   |
| `GUNPLA_DATA_FILE` | `<GUNPLA_DATA_DIR>/inventory.json`   | Full path to the data file (overrides dir) |

## API

| Method | Path                | Description                          |
| ------ | ------------------- | ------------------------------------ |
| GET    | `/api/health`       | Status + kit count + data-file path  |
| GET    | `/api/items`        | All kits                             |
| GET    | `/api/items/:code`  | One kit                              |
| POST   | `/api/items`        | Create/upsert a kit                  |
| PUT    | `/api/items/:code`  | Update a kit                         |
| DELETE | `/api/items/:code`  | Delete a kit                         |
| POST   | `/api/reset`        | Reset all kits back to `seed.json`   |

## Backups & safety

- Your whole collection is the single file `~/Documents/Gunpla Inventory/inventory.json` —
  copy it anywhere to back it up, or just let iCloud/Dropbox sync the folder.
- Writes are **atomic** (written to a temp file, then renamed) so a crash mid-save can't leave
  a half-written file.
- If the file is ever unreadable, the server backs it up to `inventory.json.corrupt-<time>`
  instead of overwriting it, and starts empty so the app still loads.
