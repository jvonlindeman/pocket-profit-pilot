
import { Toast, useToast as useHookToast } from "@/components/ui/toast";

export type { Toast };
export const useToast = useHookToast;

export const toast = ({
  title,
  description,
  variant,
  ...props
}: Toast) => {
  const { toast } = useHookToast();

  return toast({
    title,
    description,
    variant: variant || "default",
    ...props,
  });
};
