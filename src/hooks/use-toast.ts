
// Import directly from the primary implementation file
import { 
  toast as originalToast, 
  useToast as originalUseToast,
  type ToasterToast 
} from "@/components/ui/use-toast.tsx";

// Create a wrapper for the toast function that handles variant validation
export function toast(props: Omit<ToasterToast, "id">) {
  // Create a copy of the props to avoid modifying the original
  const validProps = { ...props };
  
  // Validate the variant and set a default if it's not a valid value
  if (validProps.variant && !["default", "destructive", "success"].includes(validProps.variant)) {
    validProps.variant = "default";
  }
  
  return originalToast(validProps);
}

// Export the original useToast hook
export { originalUseToast as useToast };
export type { ToasterToast };
