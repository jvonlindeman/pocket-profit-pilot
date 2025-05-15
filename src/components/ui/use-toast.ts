
// This file simply re-exports from hooks/use-toast.ts to maintain compatibility
import { useToast, toast } from "@/hooks/use-toast";
import type { ToasterToast } from "@/hooks/use-toast";

// Validate the toast variant
const originalToast = toast;
const wrappedToast = (props: any) => {
  // Validate toast variant if provided
  const validVariants = ["default", "destructive", "success", "warning"];
  if (props.variant && !validVariants.includes(props.variant)) {
    console.warn(`Toast variant "${props.variant}" is not valid. Using "default" instead.`);
    props.variant = "default";
  }
  return originalToast(props);
};

export { useToast, wrappedToast as toast };
export type { ToasterToast };
