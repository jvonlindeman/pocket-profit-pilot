
import { type ToasterToast, toast as showToast, useToast as useToastHook } from "@/components/ui/use-toast";

export type Toast = ToasterToast;
export const useToast = useToastHook;

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
