import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { BuildPriority, GunplaItem, Paint } from "../types";
import { BUILD_STAGES, PRIORITY_OPTIONS } from "../lib/inventory";
import { photoUrl, uploadPhoto } from "../lib/api";

const NONE = "none";

interface ProjectDetailDialogProps {
  item: GunplaItem | null;
  online: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPhoto: (item: GunplaItem, filename: string) => void;
  onRemovePhoto: (item: GunplaItem, filename: string) => void;
  onSaveStageNote: (item: GunplaItem, stageKey: string, note: string) => void;
  onSavePaints: (item: GunplaItem, paints: Paint[]) => void;
  onSaveInfo: (
    item: GunplaItem,
    info: {
      startedAt: string | null;
      finishedAt: string | null;
      priority: BuildPriority | null;
    }
  ) => void;
}

const ProjectDetailDialog = ({
  item,
  online,
  onOpenChange,
  onAddPhoto,
  onRemovePhoto,
  onSaveStageNote,
  onSavePaints,
  onSaveInfo,
}: ProjectDetailDialogProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Editable drafts (committed on blur/change). Reseed when a project opens.
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [paints, setPaints] = useState<Paint[]>([]);
  const [startedAt, setStartedAt] = useState("");
  const [finishedAt, setFinishedAt] = useState("");
  const [priority, setPriority] = useState<string>(NONE);

  useEffect(() => {
    if (!item) return;
    setNotes(item.stageNotes ?? {});
    setPaints(item.paints ?? []);
    setStartedAt(item.startedAt ?? "");
    setFinishedAt(item.finishedAt ?? "");
    setPriority(item.priority ?? NONE);
    // Reseed only when switching project (code) or (re)opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.code]);

  if (!item) return null;
  const current = item;

  const photos = current.photos ?? [];

  const handlePick = () => fileRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!online) {
      toast.error("Start the app's local server to save photos.");
      return;
    }
    setUploading(true);
    try {
      const filename = await uploadPhoto(current.code, file);
      onAddPhoto(current, filename);
      toast.success("Photo added");
    } catch (err) {
      toast.error(`Could not add photo: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const commitPaints = (next: Paint[]) => {
    setPaints(next);
    onSavePaints(current, next);
  };
  const updatePaint = (i: number, patch: Partial<Paint>) =>
    setPaints((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p))
    );

  const commitInfo = (patch: {
    startedAt?: string;
    finishedAt?: string;
    priority?: string;
  }) => {
    const s = patch.startedAt ?? startedAt;
    const f = patch.finishedAt ?? finishedAt;
    const p = patch.priority ?? priority;
    onSaveInfo(current, {
      startedAt: s || null,
      finishedAt: f || null,
      priority: p === NONE ? null : (p as BuildPriority),
    });
  };

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {current.code}
            </span>
            {current.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="photos">
          <TabsList>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="paints">Paints</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          {/* PHOTOS */}
          <TabsContent value="photos" className="mt-4 space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            <Button onClick={handlePick} disabled={uploading} variant="outline">
              {uploading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="mr-1.5 h-4 w-4" />
              )}
              Add photo
            </Button>
            {photos.length === 0 ? (
              <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                No photos yet. Snap your progress and add it here.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((f) => (
                  <div
                    key={f}
                    className="group relative overflow-hidden rounded-md border"
                  >
                    <img
                      src={photoUrl(f)}
                      alt="Build progress"
                      className="h-32 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(current, f)}
                      aria-label="Delete photo"
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PER-STAGE NOTES */}
          <TabsContent value="notes" className="mt-4 space-y-3">
            {BUILD_STAGES.map((stage) => (
              <div key={stage.key} className="space-y-1">
                <label className="text-sm font-medium">{stage.label}</label>
                <Textarea
                  rows={2}
                  placeholder="Notes, paints, settings…"
                  value={notes[stage.key] ?? ""}
                  onChange={(e) =>
                    setNotes((prev) => ({
                      ...prev,
                      [stage.key]: e.target.value,
                    }))
                  }
                  onBlur={() =>
                    onSaveStageNote(current, stage.key, notes[stage.key] ?? "")
                  }
                />
              </div>
            ))}
          </TabsContent>

          {/* PAINT RECIPE */}
          <TabsContent value="paints" className="mt-4 space-y-2">
            <div className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
              <span className="flex-1">Area / part</span>
              <span className="flex-1">Paint</span>
              <span className="w-8" />
            </div>
            {paints.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  className="h-8 flex-1"
                  placeholder="Chest red"
                  value={p.area}
                  onChange={(e) => updatePaint(i, { area: e.target.value })}
                  onBlur={() => commitPaints(paints)}
                />
                <Input
                  className="h-8 flex-1"
                  placeholder="Tamiya X-7"
                  value={p.paint}
                  onChange={(e) => updatePaint(i, { paint: e.target.value })}
                  onBlur={() => commitPaints(paints)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive"
                  onClick={() =>
                    commitPaints(paints.filter((_, idx) => idx !== i))
                  }
                  aria-label="Remove paint"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaints((prev) => [...prev, { area: "", paint: "" }])}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add paint
            </Button>
          </TabsContent>

          {/* DATES + PRIORITY */}
          <TabsContent value="info" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Started</label>
                <Input
                  type="date"
                  value={startedAt}
                  onChange={(e) => {
                    setStartedAt(e.target.value);
                    commitInfo({ startedAt: e.target.value });
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Finished</label>
                <Input
                  type="date"
                  value={finishedAt}
                  onChange={(e) => {
                    setFinishedAt(e.target.value);
                    commitInfo({ finishedAt: e.target.value });
                  }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={priority}
                onValueChange={(v) => {
                  setPriority(v);
                  commitInfo({ priority: v });
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.key} value={o.key}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!online && (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Photos need the local server running. Notes, paints, dates and
                priority save to browser storage even offline.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailDialog;
