import type { Database } from "@/integrations/supabase/types";

export type RetainerRow = Database["public"]["Tables"]["retainers"]["Row"];
export type RetainerInsert = Database["public"]["Tables"]["retainers"]["Insert"];
export type RetainerUpdate = Database["public"]["Tables"]["retainers"]["Update"];

// Normaliza números con comas, puntos y símbolos de moneda
export function parseNumberLike(value: string | number | null | undefined): number {
  if (typeof value === "number") return isFinite(value) ? value : 0;
  if (!value) return 0;
  const str = String(value)
    .replace(/[^\d,.-]/g, "") // quitar símbolos
    .trim();
  if (!str) return 0;
  // Si hay ambas coma y punto, asumir coma como separador de miles si aparece antes del punto
  if (str.includes(",") && str.includes(".")) {
    const lastComma = str.lastIndexOf(",");
    const lastDot = str.lastIndexOf(".");
    if (lastComma < lastDot) {
      // formato 1,234.56 -> quitar comas
      return Number(str.replace(/,/g, ""));
    } else {
      // formato 1.234,56 -> quitar puntos y reemplazar coma
      return Number(str.replace(/\./g, "").replace(",", "."));
    }
  }
  // Si solo hay coma, úsala como decimal
  if (str.includes(",")) return Number(str.replace(",", "."));
  return Number(str);
}

export function toBooleanLike(value: string | boolean | number | null | undefined): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const v = String(value ?? "").toLowerCase().trim();
  return ["true", "1", "sí", "si", "activo", "yes", "y"].includes(v);
}
