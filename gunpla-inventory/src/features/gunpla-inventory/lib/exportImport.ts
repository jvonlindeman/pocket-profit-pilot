import type { GunplaItem } from "../types";

// Column order used for CSV export — mirrors the original Google Sheet.
const COLUMNS: (keyof GunplaItem)[] = [
  "code",
  "name",
  "grade",
  "brand",
  "scale",
  "thirdPartyDecals",
  "peebsLimited",
  "location",
  "quantity",
  "paid",
  "source",
  "status",
  "sell",
  "delpiLink",
  "review",
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function itemsToCSV(items: GunplaItem[]): string {
  const header = COLUMNS.join(",");
  const rows = items.map((item) =>
    COLUMNS.map((col) => csvCell(item[col])).join(",")
  );
  return [header, ...rows].join("\n");
}

export function itemsToJSON(items: GunplaItem[]): string {
  return JSON.stringify(items, null, 2);
}

/** YYYY-MM-DD for filenames. */
export function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Trigger a browser download of text content. */
export function downloadFile(
  filename: string,
  content: string,
  mime: string
): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCSV(items: GunplaItem[]): void {
  downloadFile(
    `gunpla-inventory-${dateStamp()}.csv`,
    itemsToCSV(items),
    "text/csv"
  );
}

export function exportJSON(items: GunplaItem[]): void {
  downloadFile(
    `gunpla-inventory-${dateStamp()}.json`,
    itemsToJSON(items),
    "application/json"
  );
}
