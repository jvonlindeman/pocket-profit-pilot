
// This is a re-export file for better organization
import { toast as showToast, useToast as useToastOriginal, type ToasterToast } from "@/components/ui/use-toast";

export type Toast = ToasterToast;

// Re-export the useToast hook directly
export const useToast = useToastOriginal;

// Export a slightly enhanced version of toast
export const toast = ({
  title,
  description,
  variant,
  ...props
}: Toast) => {
  return showToast({
    title,
    description,
    variant: variant || "default",
    ...props,
  });
};
