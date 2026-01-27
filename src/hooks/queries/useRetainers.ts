import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { RetainerRow, RetainerInsert, RetainerUpdate } from "@/types/retainers";

const RETAINERS_QUERY_KEY = ["retainers"] as const;

const SUPABASE_URL = "https://rstexocnpvtxfhqbnetn.supabase.co";

export function useRetainersQuery() {
  return useQuery<RetainerRow[]>({
    queryKey: RETAINERS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("retainers")
        .select("*")
        .order("client_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateRetainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RetainerInsert) => {
      const { data, error } = await supabase.from("retainers").insert(payload).select("*").maybeSingle();
      if (error) throw error;
      return data as RetainerRow;
    },
    onSuccess: () => {
      toast({ title: "Guardado", description: "Retainer creado correctamente." });
      qc.invalidateQueries({ queryKey: RETAINERS_QUERY_KEY });
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message ?? "No se pudo crear.", variant: "destructive" }),
  });
}

export function useUpdateRetainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: RetainerUpdate }) => {
      const { data, error } = await supabase.from("retainers").update(values).eq("id", id).select("*").maybeSingle();
      if (error) throw error;
      return data as RetainerRow;
    },
    onSuccess: () => {
      toast({ title: "Actualizado", description: "Retainer actualizado." });
      qc.invalidateQueries({ queryKey: RETAINERS_QUERY_KEY });
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message ?? "No se pudo actualizar.", variant: "destructive" }),
  });
}

export function useDeleteRetainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("retainers").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({ title: "Eliminado", description: "Retainer eliminado." });
      qc.invalidateQueries({ queryKey: RETAINERS_QUERY_KEY });
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message ?? "No se pudo eliminar.", variant: "destructive" }),
  });
}

export async function upsertByClientName(row: RetainerInsert): Promise<void> {
  // upsert manual por client_name (no hay unique constraint)
  const { data: existing, error: selErr } = await supabase
    .from("retainers")
    .select("id")
    .eq("client_name", row.client_name)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing?.id) {
    const updatePayload: any = {
      specialty: row.specialty ?? null,
      net_income: row.net_income ?? 0,
      social_media_cost: row.social_media_cost ?? 0,
      total_expenses: row.total_expenses ?? 0,
      active: row.active ?? true,
      notes: row.notes ?? null,
      metadata: row.metadata ?? {},
    };
    // Add new fields if present
    if ((row as any).uses_stripe !== undefined) updatePayload.uses_stripe = (row as any).uses_stripe;
    if ((row as any).articles_per_month !== undefined) updatePayload.articles_per_month = (row as any).articles_per_month;
    if ((row as any).has_whatsapp_bot !== undefined) updatePayload.has_whatsapp_bot = (row as any).has_whatsapp_bot;
    
    const { error } = await supabase
      .from("retainers")
      .update(updatePayload)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("retainers").insert(row);
    if (error) throw error;
  }
}

interface SyncClientStatusResult {
  success: boolean;
  updated: number;
  notFound: number;
  notFoundClients: string[];
  total: number;
}

export function useSyncClientStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<SyncClientStatusResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-client-status`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      const msg = data.notFound > 0
        ? `${data.updated} actualizados, ${data.notFound} sin n8n_id asignado`
        : `${data.updated} estados actualizados`;
      toast({ title: "Sincronización completada", description: msg });
      qc.invalidateQueries({ queryKey: RETAINERS_QUERY_KEY });
    },
    onError: (e: any) => toast({ 
      title: "Error al sincronizar", 
      description: e?.message ?? "No se pudo conectar con n8n", 
      variant: "destructive" 
    }),
  });
}
