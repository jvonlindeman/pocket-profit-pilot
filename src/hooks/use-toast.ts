
// Direct implementation to avoid circular dependencies
import { toast as baseToast, useToast as baseUseToast, ToasterToast } from "@/components/ui/use-toast"

// Export the type with the same name as it's declared in use-toast.tsx
export type { ToasterToast };

// Re-export the hook
export const useToast = baseUseToast;

// Export enhanced toast function that matches the signature of the original toast function
export const toast = ({
  title,
  description,
  variant,
  ...props
}: Omit<ToasterToast, "id">) => {
  return baseToast({
    title,
    description,
    variant: variant || "default",
    ...props,
  });
};
