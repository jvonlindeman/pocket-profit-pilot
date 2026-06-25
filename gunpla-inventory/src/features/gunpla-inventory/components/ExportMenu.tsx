import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileText } from "lucide-react";
import type { GunplaItem } from "../types";
import { exportCSV, exportJSON } from "../lib/exportImport";

interface ExportMenuProps {
  /** The items to export (the currently visible/filtered set). */
  items: GunplaItem[];
}

const ExportMenu = ({ items }: ExportMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" disabled={items.length === 0}>
        <Download className="mr-1.5 h-4 w-4" />
        Export
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Export {items.length} kits</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => exportCSV(items)}>
        <FileText className="mr-2 h-4 w-4" />
        CSV (spreadsheet)
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => exportJSON(items)}>
        <FileJson className="mr-2 h-4 w-4" />
        JSON (backup)
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default ExportMenu;
