import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GunplaItem } from "../types";
import { STATUS_OPTIONS } from "../lib/inventory";

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Item being edited, or null when creating a new one. */
  item: GunplaItem | null;
  /** Suggested code for a new item. */
  suggestedCode: string;
  /** True if the provided code already exists (new-item collision guard). */
  existingCodes: Set<string>;
  onSave: (item: GunplaItem) => void;
}

function emptyItem(code: string): GunplaItem {
  return {
    code,
    name: "",
    grade: "HG",
    thirdPartyDecals: false,
    peebsLimited: "",
    location: "",
    quantity: 1,
    paid: null,
    source: "",
    status: "Backlog",
    sell: false,
    delpiLink: "",
    review: "",
  };
}

const ItemFormDialog = ({
  open,
  onOpenChange,
  item,
  suggestedCode,
  existingCodes,
  onSave,
}: ItemFormDialogProps) => {
  const isEditing = item !== null;
  const [form, setForm] = useState<GunplaItem>(emptyItem(suggestedCode));

  useEffect(() => {
    if (open) {
      setForm(item ? { ...item } : emptyItem(suggestedCode));
    }
  }, [open, item, suggestedCode]);

  const set = <K extends keyof GunplaItem>(key: K, value: GunplaItem[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const codeCollision =
    !isEditing && form.code.trim() !== "" && existingCodes.has(form.code.trim());
  const canSave = form.name.trim() !== "" && form.code.trim() !== "" && !codeCollision;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...form,
      code: form.code.trim(),
      name: form.name.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit kit" : "Add kit"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={form.code}
                disabled={isEditing}
                onChange={(e) => set("code", e.target.value)}
              />
              {codeCollision && (
                <p className="text-xs text-destructive">Code already exists.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                value={form.grade}
                onChange={(e) => set("grade", e.target.value)}
                placeholder="HG, EG, FM…"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Kit name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Display, Storage…"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Qty</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                value={form.quantity ?? ""}
                onChange={(e) =>
                  set(
                    "quantity",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paid">Paid (USD)</Label>
              <Input
                id="paid"
                type="number"
                min={0}
                step="0.01"
                value={form.paid ?? ""}
                onChange={(e) =>
                  set(
                    "paid",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="peebs">P-Bandai / Limited</Label>
              <Input
                id="peebs"
                value={form.peebsLimited}
                onChange={(e) => set("peebsLimited", e.target.value)}
                placeholder="P-Bandai…"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              placeholder="Where you bought it"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delpi">Decal / Delpi link</Label>
            <Input
              id="delpi"
              value={form.delpiLink}
              onChange={(e) => set("delpiLink", e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="review">Notes</Label>
            <Textarea
              id="review"
              value={form.review}
              onChange={(e) => set("review", e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="thirdParty"
                checked={form.thirdPartyDecals}
                onCheckedChange={(v) => set("thirdPartyDecals", v)}
              />
              <Label htmlFor="thirdParty">3rd-party decals</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="sell"
                checked={form.sell}
                onCheckedChange={(v) => set("sell", v)}
              />
              <Label htmlFor="sell">For sale</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isEditing ? "Save changes" : "Add kit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemFormDialog;
