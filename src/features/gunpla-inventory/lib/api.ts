import type { GunplaItem } from "../types";

// Base URL of the local SQLite API. In dev this hits the Vite proxy
// (`/gunpla-api` → http://localhost:4787/api). Override with VITE_GUNPLA_API.
const API_BASE =
  (import.meta.env?.VITE_GUNPLA_API as string | undefined) || "/gunpla-api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** Returns true if the local server is reachable. */
export async function pingApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(2500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function fetchItems(): Promise<GunplaItem[]> {
  return request<GunplaItem[]>("/items");
}

export function createItem(item: GunplaItem): Promise<GunplaItem> {
  return request<GunplaItem>("/items", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export function updateItem(item: GunplaItem): Promise<GunplaItem> {
  return request<GunplaItem>(`/items/${encodeURIComponent(item.code)}`, {
    method: "PUT",
    body: JSON.stringify(item),
  });
}

export function deleteItemApi(code: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/items/${encodeURIComponent(code)}`, {
    method: "DELETE",
  });
}

export function resetItemsApi(): Promise<GunplaItem[]> {
  return request<{ ok: boolean }>("/reset", { method: "POST" }).then(
    fetchItems
  );
}
