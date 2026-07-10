// Printable project sheet: opens a minimal page with the kit's paint recipe,
// stage checklist and notes, then triggers the browser's print dialog (from
// which the user can print on paper or save as PDF).

import type { GunplaItem } from "../types";
import { BUILD_STAGES } from "./inventory";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function printRecipeSheet(item: GunplaItem): void {
  const stages = item.stages ?? [];
  const skipped = item.skippedStages ?? [];
  const notes = item.stageNotes ?? {};
  const paints = (item.paints ?? []).filter((p) => p.area || p.paint);

  const stageRows = BUILD_STAGES.map((s) => {
    const mark = stages.includes(s.key)
      ? "☑"
      : skipped.includes(s.key)
        ? "⊘"
        : "☐";
    const note = notes[s.key] ? ` — ${esc(notes[s.key])}` : "";
    return `<li><strong>${mark} ${esc(s.label)}</strong>${note}</li>`;
  }).join("");

  const paintRows = paints.length
    ? paints
        .map(
          (p) =>
            `<tr><td>${esc(p.area || "—")}</td><td>${esc(p.paint || "—")}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="2" class="muted">Sin receta todavía</td></tr>`;

  const meta = [item.grade, item.brand, item.scale]
    .filter(Boolean)
    .map((x) => esc(String(x)))
    .join(" · ");

  const html = `<!doctype html><html><head><meta charset="utf-8">
<title>${esc(item.code)} — ${esc(item.name)}</title>
<style>
  body { font: 14px/1.5 -apple-system, system-ui, sans-serif; margin: 32px; color: #111; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  .meta { color: #666; margin-bottom: 20px; }
  h2 { font-size: 15px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 22px 0 8px; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
  th { background: #f5f5f5; }
  ul { padding-left: 4px; list-style: none; margin: 0; }
  li { padding: 3px 0; }
  .muted { color: #999; }
  @media print { body { margin: 12mm; } }
</style></head><body>
<h1>${esc(item.name)}</h1>
<div class="meta"><code>${esc(item.code)}</code>${meta ? " · " + meta : ""}</div>
<h2>🎨 Receta de pintura</h2>
<table><tr><th>Área / parte</th><th>Pintura</th></tr>${paintRows}</table>
<h2>🛠️ Etapas y notas</h2>
<ul>${stageRows}</ul>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  // Give the new document a beat to layout before the print dialog.
  setTimeout(() => win.print(), 250);
}
