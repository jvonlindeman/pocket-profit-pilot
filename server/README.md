# Gunpla Inventory — Local SQLite Server

A tiny Node + Express + SQLite API that stores your Gunpla inventory in a **local database
file on your MacBook** (`server/data/gunpla.db`). Nothing leaves your machine.

It is a separate package from the frontend (its own `package.json`), so it does not affect
the main app's build.

## Requirements

- Node.js 18+ (`node --version`)

## First run

```bash
cd server
npm install        # installs express + better-sqlite3 (compiles a native module)
npm start
```

You should see:

```
🤖 Gunpla inventory API running
   → http://localhost:4787
   → DB: .../server/data/gunpla.db
   → Seeded database from seed.json
   → 361 kits loaded
```

On first start the database is **seeded with the 361 kits** from `seed.json` (exported from
the original Google Sheet). After that, the DB file is the source of truth and your edits
persist there.

## Using it with the app

In a **second terminal**, run the frontend as usual:

```bash
npm run dev        # from the repo root
```

Open <http://localhost:8080/gunpla>. When the server is up, the page header shows a green
**Local DB** badge and every add/edit/delete is written to SQLite. If the server is off, the
page falls back to browser storage and shows **Browser only**.

The frontend reaches the API via the Vite dev proxy (`/gunpla-api` → `localhost:4787`),
configured in `vite.config.ts`.

## Scripts

| Command       | What it does                                              |
| ------------- | -------------------------------------------------------- |
| `npm start`   | Run the API server on port 4787                          |
| `npm run dev` | Same, with `--watch` auto-restart on file changes        |
| `npm run seed`| Re-seed the DB from `seed.json` (overwrites all rows)    |

## Configuration (env vars)

| Variable         | Default                 | Purpose                          |
| ---------------- | ----------------------- | -------------------------------- |
| `GUNPLA_PORT`    | `4787`                  | Port the API listens on          |
| `GUNPLA_DB_PATH` | `server/data/gunpla.db` | Where the SQLite file is stored  |

## API

| Method | Path                | Description                          |
| ------ | ------------------- | ------------------------------------ |
| GET    | `/api/health`       | Status + kit count + DB path         |
| GET    | `/api/items`        | All kits                             |
| GET    | `/api/items/:code`  | One kit                              |
| POST   | `/api/items`        | Create/upsert a kit                  |
| PUT    | `/api/items/:code`  | Update a kit                         |
| DELETE | `/api/items/:code`  | Delete a kit                         |
| POST   | `/api/reset`        | Reset all kits back to `seed.json`   |

## Backups

The whole database is the single file `server/data/gunpla.db` — copy it anywhere to back it
up. It is gitignored so your live data is never committed.
