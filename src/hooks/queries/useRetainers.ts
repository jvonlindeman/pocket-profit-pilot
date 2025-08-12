import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { RetainerRow, RetainerInsert, RetainerUpdate } from "@/types/retainers";

const RETAINERS_QUERY_KEY = ["retainers"] as const;

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
    const { error } = await supabase
      .from("retainers")
      .update({
        specialty: row.specialty ?? null,
        net_income: row.net_income ?? 0,
        social_media_cost: row.social_media_cost ?? 0,
        total_expenses: row.total_expenses ?? 0,
        active: row.active ?? true,
        notes: row.notes ?? null,
        metadata: row.metadata ?? {},
      })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("retainers").insert(row);
    if (error) throw error;
  }
}
