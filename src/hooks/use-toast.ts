
// Direct implementation to avoid circular dependencies
import { toast as baseToast, useToast as baseUseToast } from "@/components/ui/use-toast.tsx"
import type { ToasterToast } from "@/components/ui/use-toast.tsx"

// Export the type with the same name
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
