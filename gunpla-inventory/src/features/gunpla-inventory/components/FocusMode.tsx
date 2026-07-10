import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Ban,
  CheckCircle2,
  Circle,
  ImagePlus,
  Loader2,
  Printer,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { GunplaItem } from "../types";
import { BUILD_STAGES, stagesDone, stagesSkipped } from "../lib/inventory";
import { photoUrl, uploadPhoto } from "../lib/api";
import { printRecipeSheet } from "../lib/printSheet";

const TOTAL = BUILD_STAGES.length;

interface FocusModeProps {
  item: GunplaItem;
  online: boolean;
  onClose: () => void;
  onToggleStage: (item: GunplaItem, stageKey: string) => void;
  onSaveStageNote: (item: GunplaItem, stageKey: string, note: string) => void;
  onAddPhoto: (item: GunplaItem, filename: string) => void;
}

/**
 * Distraction-free view of ONE active build — big touch targets so it works
 * great on a phone at the workbench: tap stages, jot per-stage notes, snap a
 * photo with the camera, and print the recipe sheet.
 */
const FocusMode = ({
  item,
  online,
  onClose,
  onToggleStage,
  onSaveStageNote,
  onAddPhoto,
}: FocusModeProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>(
    item.stageNotes ?? {}
  );

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stages = item.stages ?? [];
  const skipped = item.skippedStages ?? [];
  const done = stagesDone(stages);
  const skippedCount = stagesSkipped(skipped);
  const applicable = TOTAL - skippedCount;
  const complete = done + skippedCount >= TOTAL;
  const pct = Math.round((done / Math.max(1, applicable)) * 100);
  const paints = (item.paints ?? []).filter((p) => p.area || p.paint);
  const photos = item.photos ?? [];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!online) {
      toast.error("El servidor local no está activo — no puedo guardar fotos.");
      return;
    }
    setUploading(true);
    try {
      const filename = await uploadPhoto(item.code, file);
      onAddPhoto(item, filename);
      toast.success("Photo added");
    } catch (err) {
      toast.error(`Could not add photo: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto max-w-2xl space-y-5 p-4 pb-16 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {item.code}
              </span>
              {(item.grade || item.brand) && (
                <Badge variant="outline">{item.grade || item.brand}</Badge>
              )}
              {item.scale && (
                <span className="text-xs text-muted-foreground">
                  {item.scale}
                </span>
              )}
            </div>
            <h1 className="truncate text-xl font-bold">{item.name}</h1>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => printRecipeSheet(item)}
              title="Imprimir hoja del proyecto"
              aria-label="Print sheet"
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              aria-label="Close focus mode"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-semibold">
            {complete ? "Built 🎉" : `${done}/${applicable}`}
          </span>
        </div>

        {/* Photo quick action */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          className="w-full py-6 text-base"
          variant="outline"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="mr-2 h-5 w-5" />
          )}
          Tomar / agregar foto del avance
        </Button>

        {/* Stages with notes — big touch targets */}
        <div className="space-y-2">
          {BUILD_STAGES.map((stage) => {
            const state = stages.includes(stage.key)
              ? "done"
              : skipped.includes(stage.key)
                ? "skipped"
                : "pending";
            return (
              <div key={stage.key} className="rounded-lg border">
                <button
                  type="button"
                  onClick={() => onToggleStage(item, stage.key)}
                  title="Click: done → skipped → pending"
                  className="flex w-full items-center gap-3 px-3 py-3 text-left text-base hover:bg-muted"
                >
                  {state === "done" ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
                  ) : state === "skipped" ? (
                    <Ban className="h-6 w-6 shrink-0 text-muted-foreground/70" />
                  ) : (
                    <Circle className="h-6 w-6 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={
                      state === "done"
                        ? "text-muted-foreground line-through"
                        : state === "skipped"
                          ? "italic text-muted-foreground/70 line-through"
                          : "font-medium"
                    }
                  >
                    {stage.label}
                  </span>
                  {state === "skipped" && (
                    <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground/60">
                      skipped
                    </span>
                  )}
                </button>
                <div className="px-3 pb-3">
                  <Textarea
                    rows={1}
                    placeholder="Nota (pintura, ajustes…)"
                    className="min-h-[36px] text-sm"
                    value={notes[stage.key] ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({
                        ...prev,
                        [stage.key]: e.target.value,
                      }))
                    }
                    onBlur={() =>
                      onSaveStageNote(item, stage.key, notes[stage.key] ?? "")
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Paint recipe (read-only reference at the bench) */}
        <div className="rounded-lg border p-3">
          <h2 className="mb-2 text-sm font-semibold">🎨 Receta de pintura</h2>
          {paints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin receta — agrégala en Details → Paints.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {paints.map((p, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{p.area || "—"}</span>
                  <span className="text-right font-medium">
                    {p.paint || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Latest photos strip */}
        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.slice(-6).map((f) => (
              <img
                key={f}
                src={photoUrl(f)}
                alt=""
                className="h-20 w-20 shrink-0 rounded-md border object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusMode;
