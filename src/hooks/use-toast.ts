
// Direct implementation to avoid circular dependencies
import { toast as baseToast, useToast as baseUseToast, type ToasterToast } from "@/components/ui/use-toast"

export type Toast = ToasterToast;

export const useToast = baseUseToast;

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
