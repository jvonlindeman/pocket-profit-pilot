
// This file simply re-exports from hooks/use-toast.ts to maintain compatibility
import { useToast, toast } from "@/hooks/use-toast";
import type { ToasterToast } from "@/hooks/use-toast";

export { useToast, toast };
export type { ToasterToast };
