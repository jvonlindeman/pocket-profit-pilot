// Manually (re)seed the SQLite database from seed.json, overwriting all rows.
// Usage: npm run seed
import { resetToSeed, DB_PATH } from "./db.mjs";

const count = resetToSeed();
console.log(`Seeded ${count} kits into ${DB_PATH}`);
