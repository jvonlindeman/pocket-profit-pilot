
import { useToast as useToastOriginal, toast as toastOriginal } from "@/components/ui/use-toast";
import type { ToasterToast } from "@/components/ui/use-toast";

// Extend the toast function to handle potential variant updates
export const useToast = useToastOriginal;

// Create a proxy for the toast function that ensures it uses valid variants
export const toast = (props: ToasterToast) => {
  const validProps = { ...props };
  
  // Convert any invalid variants to valid ones
  if (validProps.variant === "warning") {
    validProps.variant = "default";
  }
  
  return toastOriginal(validProps);
};

export type { ToasterToast };
