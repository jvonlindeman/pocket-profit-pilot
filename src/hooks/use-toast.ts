
// Direct implementation to avoid circular dependencies
import { toast as baseToast, useToast as baseUseToast, type ToasterToast } from "@/components/ui/use-toast"

// Export the type with our desired name
export type Toast = ToasterToast;

// Re-export the hook
export const useToast = baseUseToast;

// Export enhanced toast function
export const toast = ({
  title,
  description,
  variant,
  ...props
}: Toast) => {
  return baseToast({
    title,
    description,
    variant: variant || "default",
    ...props,
  });
};
