import type { GunplaItem } from "../types";

// Base URL of the local JSON-file API. In dev this hits the Vite proxy
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

// --- Progress photos ---------------------------------------------------------

/** Shrink an image client-side to a JPEG base64 string (no data: prefix). */
export function downscaleToJpegBase64(
  file: File,
  maxPx = 1600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl.split(",")[1] || "");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

/** Upload a photo for a kit; returns the stored filename. */
export async function uploadPhoto(code: string, file: File): Promise<string> {
  const base64 = await downscaleToJpegBase64(file);
  const { filename } = await request<{ filename: string }>("/photos", {
    method: "POST",
    body: JSON.stringify({ code, ext: "jpg", base64 }),
  });
  return filename;
}

export function deletePhotoApi(filename: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/photos/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
}

/** Root-relative URL where the local server serves a saved photo file. */
export function photoUrl(filename: string): string {
  return `/photos/${encodeURIComponent(filename)}`;
}
