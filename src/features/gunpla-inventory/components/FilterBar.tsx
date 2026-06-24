import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Tag, X } from "lucide-react";
import type { InventoryFilters } from "../types";

interface FilterBarProps {
  filters: InventoryFilters;
  grades: string[];
  statuses: string[];
  locations: string[];
  onChange: (patch: Partial<InventoryFilters>) => void;
  onClear: () => void;
}

const ALL = "__all__";

const FilterBar = ({
  filters,
  grades,
  statuses,
  locations,
  onChange,
  onClear,
}: FilterBarProps) => {
  const hasActiveFilters =
    filters.search ||
    filters.grade ||
    filters.status ||
    filters.location ||
    filters.sellOnly;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search name, code, source…"
          className="pl-8"
        />
      </div>

      <Select
        value={filters.grade || ALL}
        onValueChange={(v) => onChange({ grade: v === ALL ? "" : v })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Grade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All grades</SelectItem>
          {grades.map((g) => (
            <SelectItem key={g} value={g}>
              {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status || ALL}
        onValueChange={(v) => onChange({ status: v === ALL ? "" : v })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.location || ALL}
        onValueChange={(v) => onChange({ location: v === ALL ? "" : v })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All locations</SelectItem>
          {locations.map((l) => (
            <SelectItem key={l} value={l}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant={filters.sellOnly ? "default" : "outline"}
        onClick={() => onChange({ sellOnly: !filters.sellOnly })}
      >
        <Tag className="mr-1.5 h-4 w-4" />
        For sale
      </Button>

      {hasActiveFilters && (
        <Button type="button" variant="ghost" onClick={onClear}>
          <X className="mr-1.5 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default FilterBar;
