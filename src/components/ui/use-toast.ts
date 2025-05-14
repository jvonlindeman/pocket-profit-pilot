
// This file simply re-exports from components/ui/use-toast.tsx to maintain compatibility
import { useToast, toast } from "@/hooks/use-toast";
import type { ToasterToast } from "@/hooks/use-toast";

export { useToast, toast };
export type { ToasterToast };
