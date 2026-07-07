import { useEffect, useMemo, useState } from "react";
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
import { List } from "lucide-react";
import type { GunplaItem } from "../types";
import { STATUS_OPTIONS, distinctValues, nextCode } from "../lib/inventory";

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Item being edited, or null when creating a new one. */
  item: GunplaItem | null;
  /** Whole inventory — used to suggest options and auto-generate the code. */
  items: GunplaItem[];
  onSave: (item: GunplaItem) => void;
}

const NEW_VALUE = "__new__";

/** Common kit scales offered alongside whatever values already exist. */
const SCALE_SUGGESTIONS = ["1/144", "1/100", "1/60", "1/48", "Non-scale"];

/**
 * Prefix for auto-generated codes: the grade when set (Bandai kits), else the
 * brand's first word (third-party kits, e.g. "Moxin" → MOXIN-001), else "KIT".
 */
function codePrefix(grade: string, brand: string): string {
  const g = grade.trim();
  if (g) return g;
  const b = brand.trim().split(/\s+/)[0]?.replace(/[^a-zA-Z0-9]/g, "") ?? "";
  return b ? b.toUpperCase().slice(0, 8) : "KIT";
}

/**
 * A dropdown of existing values with an "Add new…" escape hatch. Falls back to a
 * free-text input for brand-new or one-off values, with a button to return to the list.
 */
const NONE_VALUE = "__none__";

function SuggestField({
  id,
  value,
  options,
  placeholder,
  onChange,
  clearable = false,
}: {
  id?: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
  /** Offer a "None" choice that sets the value to "". */
  clearable?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const known = options.includes(value);
  const showInput = adding || (value !== "" && !known);

  if (showInput) {
    return (
      <div className="flex gap-1.5">
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          autoFocus={adding}
          onChange={(e) => onChange(e.target.value)}
        />
        {options.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            title="Choose from the list"
            aria-label="Choose from the list"
            onClick={() => {
              setAdding(false);
              onChange("");
            }}
          >
            <List className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v === NEW_VALUE) {
          setAdding(true);
          onChange("");
        } else if (v === NONE_VALUE) {
          onChange("");
        } else {
          onChange(v);
        }
      }}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {clearable && <SelectItem value={NONE_VALUE}>— None —</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
        <SelectItem value={NEW_VALUE}>➕ Add new…</SelectItem>
      </SelectContent>
    </Select>
  );
}

function emptyItem(grade: string, code: string): GunplaItem {
  return {
    code,
    name: "",
    grade,
    brand: "",
    scale: "",
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
    stages: [],
  };
}

const ItemFormDialog = ({
  open,
  onOpenChange,
  item,
  items,
  onSave,
}: ItemFormDialogProps) => {
  const isEditing = item !== null;

  const gradeOptions = useMemo(() => distinctValues(items, "grade"), [items]);
  const brandOptions = useMemo(() => distinctValues(items, "brand"), [items]);
  const scaleOptions = useMemo(() => {
    const seen = new Set(distinctValues(items, "scale"));
    for (const s of SCALE_SUGGESTIONS) seen.add(s);
    return [...seen];
  }, [items]);
  const locationOptions = useMemo(
    () => distinctValues(items, "location"),
    [items]
  );
  const sourceOptions = useMemo(() => distinctValues(items, "source"), [items]);
  const peebsOptions = useMemo(
    () => distinctValues(items, "peebsLimited"),
    [items]
  );
  const makeCode = (grade: string, brand = "") =>
    nextCode(items, codePrefix(grade, brand));

  const [form, setForm] = useState<GunplaItem>(() =>
    emptyItem("HG", makeCode("HG"))
  );

  useEffect(() => {
    if (!open) return;
    setForm(item ? { ...item } : emptyItem("HG", makeCode("HG")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const set = <K extends keyof GunplaItem>(key: K, value: GunplaItem[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Changing grade or brand re-generates the (read-only) code for new kits:
  // grade wins as prefix; without a grade the brand is used (third-party kits).
  const setGrade = (grade: string) =>
    setForm((prev) => ({
      ...prev,
      grade,
      code: isEditing ? prev.code : makeCode(grade, prev.brand ?? ""),
    }));
  const setBrand = (brand: string) =>
    setForm((prev) => ({
      ...prev,
      brand,
      code: isEditing ? prev.code : makeCode(prev.grade, brand),
    }));

  const canSave = form.name.trim() !== "" && form.code.trim() !== "";

  const handleSave = () => {
    if (!canSave) return;
    onSave({ ...form, code: form.code.trim(), name: form.name.trim() });
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
                readOnly
                tabIndex={-1}
                className="cursor-not-allowed bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                {isEditing ? "Fixed ID" : "Auto-generated from grade"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grade">Grade / Line</Label>
              <SuggestField
                id="grade"
                value={form.grade}
                options={gradeOptions}
                placeholder="HG, MG, RG…"
                onChange={setGrade}
                clearable
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand</Label>
              <SuggestField
                id="brand"
                value={form.brand ?? ""}
                options={brandOptions}
                placeholder="Bandai, Moxin…"
                onChange={setBrand}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scale">Scale</Label>
              <SuggestField
                id="scale"
                value={form.scale ?? ""}
                options={scaleOptions}
                placeholder="1/144, 1/100…"
                onChange={(v) => set("scale", v)}
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
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
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
              <SuggestField
                id="location"
                value={form.location}
                options={locationOptions}
                placeholder="Display, Storage…"
                onChange={(v) => set("location", v)}
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
              <SuggestField
                id="peebs"
                value={form.peebsLimited}
                options={peebsOptions}
                placeholder="No, P-Bandai…"
                onChange={(v) => set("peebsLimited", v)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source">Source</Label>
            <SuggestField
              id="source"
              value={form.source}
              options={sourceOptions}
              placeholder="Where you bought it"
              onChange={(v) => set("source", v)}
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
