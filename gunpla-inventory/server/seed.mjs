// Manually (re)seed the data file from seed.json, overwriting everything.
// Usage: npm run seed
import { resetToSeed, DATA_FILE } from "./db.mjs";

const count = resetToSeed();
console.log(`Seeded ${count} kits into ${DATA_FILE}`);
