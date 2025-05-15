
import { toast as originalToast, useToast as originalUseToast } from "@/components/ui/use-toast";
import type { ToasterToast } from "@/components/ui/use-toast";

// Create a wrapper for the toast function that handles variant conversion
const toast = (props: Omit<ToasterToast, "id">) => {
  const validProps = { ...props };
  
  // Convert any invalid variants to valid ones
  // Check if the variant is not one of the valid options
  if (validProps.variant && !["default", "destructive", "success"].includes(validProps.variant as string)) {
    validProps.variant = "default";
  }
  
  return originalToast(validProps);
};

// Export the original useToast hook
const useToast = originalUseToast;

export { useToast, toast };
export type { ToasterToast };
